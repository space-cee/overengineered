import { Players } from "@rbxts/services";
import { Db } from "engine/server/Database";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { useExternalDatabaseOnly } from "server/database/DatabaseConfig";
import { ExternalDatabase } from "server/database/ExternalDatabase";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";
import type { MigrationResponse } from "server/database/ExternalDatabase";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";

@injectable
export class SlotDatabase {
	private readonly onlinePlayers = new Set<number>();
	private readonly blocksdb;

	constructor(
		private readonly datastore: DatabaseBackend<
			BlocksSerializer.JsonSerializedBlocks,
			[ownerId: number, slotId: number]
		>,
		@inject private readonly players: PlayerDatabase,
	) {
		this.blocksdb = new Db<
			LatestSerializedBlocks,
			BlocksSerializer.JsonSerializedBlocks,
			[ownerId: number, slotId: number]
		>(
			this.datastore,
			() => ({ version: BlocksSerializer.latestVersion, blocks: [] }),
			(slot) => BlocksSerializer.jsonToObject(slot),
			(slot) => BlocksSerializer.objectToJson(slot),
		);

		Players.PlayerAdded.Connect((plr) => this.onlinePlayers.add(plr.UserId));
		Players.PlayerRemoving.Connect((plr) => {
			this.onlinePlayers.delete(plr.UserId);

			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

			const id = tostring(plr.UserId);

			for (const [key, { keys }] of this.blocksdb.loadedUnsavedEntries()) {
				if (key.find(id + "_")[0] === undefined) {
					continue;
				}

				$log("Saving " + key);
				this.blocksdb.save(keys, key);
				this.blocksdb.free(keys, key);
			}
		});

		CustomRemotes.admin.adminUpdateMeta.invoked.Connect((invoker, arg) => {
			if (isNotAdmin_AutoBanned(invoker, "adm_update_meta")) return;
			this.setMeta(arg.plrID, this.getMeta(arg.plrID) ?? []);
		});
		CustomRemotes.admin.adminWipeData.invoked.Connect((invoker, plrID) => {
			if (isNotAdmin_AutoBanned(invoker, "adm_wipe_data")) return;
			this.setMeta(plrID, []);
		});
		CustomRemotes.admin.adminMigrateRequest.invoked.Connect((invoker, arg) => {
			if (isNotAdmin_AutoBanned(invoker, "adm_request_migration")) return;
			CustomRemotes.admin.adminMigrateReply.send(invoker, this.migrate(arg.from, arg.to, arg.forceDatastore));
		});
	}

	private ensureValidSlotIndex(userId: number, index: number) {
		if (SlotsMeta.getSpecial(index)) return;

		const pdata = this.players.get(userId);
		const player = Players.GetPlayerByUserId(userId);
		if (!player) return;

		const maxSlots = GameDefinitions.getMaxSlots(player, pdata.purchasedSlots ?? 0);

		if (index >= 0 && index < maxSlots) {
			return;
		}

		if (SlotsMeta.isTestSlot(index)) {
			return;
		}

		throw "Invalid slot index " + index;
	}

	private notEmpty = (arr: readonly SlotMeta[] | undefined): arr is readonly SlotMeta[] =>
		arr !== undefined && arr.size() > 0;

	private getMeta(userId: number) {
		const playerData = this.players.get(userId);
		const get = playerData?.slots;
		if (this.notEmpty(get)) return get;
		const external = ExternalDatabase.GetPlayer(userId, playerData?.settings?.useSpaceCee)?.slots;
		if (this.notEmpty(external)) return external;
		return [];
	}

	private setMeta(userId: number, slots: readonly SlotMeta[], external?: boolean) {
		const shouldUseExternal = external || useExternalDatabaseOnly;
		this.players.set(userId, { ...this.players.get(userId), slots }, shouldUseExternal);

		if (!this.onlinePlayers.has(userId)) {
			for (const slot of slots) {
				this.blocksdb.save([userId, slot.index]);
				this.blocksdb.free([userId, slot.index]);
			}

			$log(`Saving data of the OFFLINE player ${userId}`);
		}
	}

	migrate(fromUserId: number, toUserId: number, forceDatastore?: boolean): MigrationResponse {
		const fromPlayerData = this.players.get(fromUserId);
		const fromMeta = this.getMeta(fromUserId);

		if (!this.notEmpty(fromMeta)) {
			print(`[migrate] No slot metadata found for ${fromUserId}, aborting`);
			return { metadata: "FAIL", saves: "FAIL" };
		}
		print(`[migrate] Got ${fromMeta.size()} slots for ${fromUserId}, forceDatastore=${forceDatastore}`);

		this.players.set(toUserId, fromPlayerData, !forceDatastore);

		let savesOk = true;
		for (const slot of fromMeta) {
			let blocks: LatestSerializedBlocks | undefined;

			if (forceDatastore) {
				try {
					blocks = this.blocksdb.get([fromUserId, slot.index]);
					print(`[migrate] datastore read OK for slot ${slot.index}, blocks:`, blocks.blocks.size());
				} catch (e) {
					print(`[migrate] datastore read THREW for slot ${slot.index}:`, e);
					savesOk = false;
					continue;
				}
			} else {
				blocks = ExternalDatabase.GetSave([fromUserId, slot.index], fromPlayerData.settings?.useSpaceCee);
				if (!blocks) {
					print(`[migrate] external GetSave returned nothing for slot ${slot.index}`);
					savesOk = false;
					continue;
				}
			}

			if (forceDatastore) {
				this.blocksdb.set([toUserId, slot.index], blocks);
				print(`[migrate] datastore write OK for slot ${slot.index}`);
			} else {
				const jsonBlocks = BlocksSerializer.objectToJson(blocks);
				const result = ExternalDatabase.SaveSlot(
					toUserId,
					{ index: slot.index, blocks: jsonBlocks },
					fromPlayerData.settings?.useSpaceCee,
				);
				if ("error" in result) {
					print(`[migrate] external SaveSlot FAILED for slot ${slot.index}:`, result.error, result.err_type);
					savesOk = false;
				} else {
					print(`[migrate] external SaveSlot OK for slot ${slot.index}`);
				}
			}
		}

		// write target's slot metadata list (blocks count, saveTime, etc. mirror the source's)
		this.setMeta(toUserId, fromMeta, !forceDatastore);

		print(`[migrate] Done. savesOk=${savesOk}`);
		return { metadata: "SUCCESS", saves: savesOk ? "SUCCESS" : "FAIL" };
	}

	getBlocks(userId: number, index: number): LatestSerializedBlocks {
		this.ensureValidSlotIndex(userId, index);
		return this.blocksdb.get([userId, index]);
	}
	setBlocks(userId: number, index: number, blocks: LatestSerializedBlocks | undefined) {
		this.ensureValidSlotIndex(userId, index);

		blocks ??= { version: BlocksSerializer.latestVersion, blocks: [] };
		this.blocksdb.set([userId, index], blocks);

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, {
			...SlotsMeta.get(meta, index),
			blocks: blocks.blocks.size(),
			saveTime: DateTime.now().UnixTimestampMillis,
			index,
		});
		this.setMeta(userId, meta);
	}
	setBlocksFromAnotherSlot(userId: number, index: number, indexfrom: number) {
		this.ensureValidSlotIndex(userId, index);
		this.ensureValidSlotIndex(userId, indexfrom);
		this.blocksdb.set([userId, index], this.getBlocks(userId, indexfrom));

		const meta = [...this.getMeta(userId)];
		SlotsMeta.set(meta, { ...SlotsMeta.get(meta, indexfrom), ...(SlotsMeta.getSpecialNoTest(index) ?? {}), index });
		this.setMeta(userId, meta);
	}

	updateMeta(
		userId: number,
		index: number,
		metaUpdate: (meta: readonly SlotMeta[]) => readonly SlotMeta[],
		external?: boolean,
	): void {
		this.ensureValidSlotIndex(userId, index);

		const meta = metaUpdate(this.getMeta(userId));
		this.setMeta(userId, meta, external);
	}
	delete(userId: number, index: number): void {
		this.ensureValidSlotIndex(userId, index);

		this.blocksdb.delete([userId, index]);
		this.updateMeta(userId, index, (meta) => SlotsMeta.withRemovedSlot(meta, index));
	}
}
