import { RunService } from "@rbxts/services";
import { DataStoreDatabaseBackend } from "engine/server/backend/DataStoreDatabaseBackend";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { CustomRemotes } from "shared/Remotes";
import type { MigrationResponse } from "server/database/ExternalDatabase";
import type { PlayerDatabaseData } from "server/database/PlayerDatabase";

// Datastore-only migration: copy entries from one user id to another across
// datastore namespaces (non-destructive). Copies `players` (metadata) and
// `slots` (saves/plots) datastores.
if (RunService.IsServer()) {
	CustomRemotes.admin.adminDatastoreMigrate.invoked.Connect((invoker, arg) => {
		if (isNotAdmin_AutoBanned(invoker, "adm_datastore_migrate")) {
			print("[DatastoreMigration] invocation blocked: not admin");
			return;
		}

		print(`[DatastoreMigration] invoked by ${invoker.Name} from=${tostring(arg.from)} to=${tostring(arg.to)}`);

		const playersBackend = DataStoreDatabaseBackend.tryCreate<PlayerDatabaseData>("players");
		const slotsBackend = DataStoreDatabaseBackend.tryCreate<readonly SlotMeta[]>("slots");

		print(
			`[DatastoreMigration] playersBackend=${tostring(playersBackend !== undefined)} slotsBackend=${tostring(slotsBackend !== undefined)}`,
		);

		let metadata: "SUCCESS" | "FAIL" = "FAIL";
		let saves: "SUCCESS" | "FAIL" = "FAIL";

		// Copy players metadata
		if (playersBackend) {
			const p = playersBackend.GetAsync([arg.from]);
			print(`[DatastoreMigration] players GET for ${arg.from} => ${tostring(p !== undefined)}`);
			if (p !== undefined) {
				playersBackend.SetAsync(p, [arg.to]);
				print(`[DatastoreMigration] players SET for ${arg.to}`);
				metadata = "SUCCESS";

				// If we have slot metadata, copy individual slot saves by index
				if (slotsBackend && p.slots !== undefined) {
					for (const slot of p.slots) {
						const idx = slot.index as number;
						const s = slotsBackend.GetAsync([arg.from, idx]);
						print(`[DatastoreMigration] slots GET for ${arg.from},${idx} => ${tostring(s !== undefined)}`);
						if (s !== undefined) {
							slotsBackend.SetAsync(s, [arg.to, idx]);
							print(`[DatastoreMigration] slots SET for ${arg.to},${idx}`);
							saves = "SUCCESS";
						}
					}
				}
			}
		}

		// Copy slot saves / plot data
		if (slotsBackend) {
			const s = slotsBackend.GetAsync([arg.from]);
			print(`[DatastoreMigration] slots GET for ${arg.from} => ${tostring(s !== undefined)}`);
			if (s !== undefined) {
				slotsBackend.SetAsync(s, [arg.to]);
				print(`[DatastoreMigration] slots SET for ${arg.to}`);
				saves = "SUCCESS";
			}
		}

		const res = { metadata, saves } as MigrationResponse;
		CustomRemotes.admin.adminMigrateReply.send(invoker, res);
		print(`[DatastoreMigration] reply sent to ${invoker.Name} => metadata=${metadata} saves=${saves}`);
	});
}
