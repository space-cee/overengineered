import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { CustomRemotes } from "shared/Remotes";
import { SlotsMeta } from "shared/SlotsMeta";
import { spawnPositionsKeyed } from "shared/SpawnPositions";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { SlotDatabase } from "server/database/SlotDatabase";
import type { PlayModeBase } from "server/modes/PlayModeBase";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { SpawnPosition } from "shared/SpawnPositions";

@injectable
export class RideMode implements PlayModeBase {
	constructor(
		@inject private readonly serverControllers: ServerPlayersController,
		@inject private readonly blockList: BlockList,
		@inject private readonly slots: SlotDatabase,
		@inject private readonly playerData: PlayerDatabase,
	) {
		CustomRemotes.modes.ride.teleportOnSeat.invoked.Connect(this.sit.bind(this));
	}
	private findDriverSeat(blocks: readonly BlockModel[]): VehicleSeat | undefined {
		return blocks
			.find((model) => {
				const id = BlockManager.manager.id.get(model);
				return id === "vehicleseat" || id === "armlessvehicleseat";
			})
			?.FindFirstChild("VehicleSeat") as VehicleSeat | undefined;
	}

	private sit(player: Player) {
		const hrp = player.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
		if (!hrp) return;
		if (hrp.Sit) return;

		const vehicleSeat = this.findDriverSeat(
			this.serverControllers.controllers.get(player.UserId)?.plotController.blocks?.getBlocks() ?? [],
		);
		if (!vehicleSeat) return;

		if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
			vehicleSeat.Occupant.Sit = false;
			task.wait(0.5);
		}

		if (hrp.Health <= 0) return;

		vehicleSeat.Sit(hrp);
	}

	onTransitionFrom(player: Player, prevmode: PlayModes | undefined, pos?: SpawnPosition): Response | undefined {
		if (prevmode === "build") {
			return this.rideStart(player, pos ?? "plot");
		}
	}
	onTransitionTo(player: Player, nextmode: PlayModes | undefined): Response | undefined {
		if (nextmode === undefined || nextmode === "build") {
			return this.rideStop(player);
		}
	}

	private initializePhysics(owner: Player, blocks: readonly BlockModel[]) {
		const data = blocks.flatmap((value) => value.GetChildren());

		const rootParts: BasePart[] = [];
		for (const instance of data) {
			if (instance.IsA("BasePart") && instance.AssemblyRootPart === instance) {
				rootParts.push(instance);
			}
		}

		const players = this.serverControllers.getPlayers().filter((p) => p !== owner);
		CustomRemotes.physics.normalizeRootparts.send(players, { parts: rootParts });
	}

	private rideStart(player: Player, pos: SpawnPosition): Response {
		print("spawning at ", pos);
		const spawnPosition = spawnPositionsKeyed[pos];

		const controller = this.serverControllers.controllers.get(player.UserId)?.plotController;
		if (!controller) throw "what";

		const blocksChildren = controller.blocks.getBlocks();

		this.slots.setBlocks(
			player.UserId,
			SlotsMeta.lastRunSlotIndex,
			BlocksSerializer.serializeToObject(controller.blocks),
		);

		if (spawnPosition) {
			for (const block of blocksChildren) {
				block.PivotTo(spawnPosition.mul(controller.blocks.origin.ToObjectSpace(block.GetPivot())));
			}

			try {
				const humanoid = player.Character?.FindFirstChild("Humanoid") as Humanoid;
				humanoid.RootPart!.PivotTo(
					spawnPosition.mul(controller.blocks.origin.ToObjectSpace(humanoid.RootPart!.GetPivot())),
				);
			} catch {
				// empty
			}
		}

		const hrp = player.Character?.WaitForChild("Humanoid") as Humanoid;
		const vehicleSeat = this.findDriverSeat(blocksChildren);
		if (vehicleSeat) {
			if (vehicleSeat.Occupant && vehicleSeat.Occupant !== player.Character?.FindFirstChild("Humanoid")) {
				vehicleSeat.Occupant.Sit = false;
				task.wait(0.5);
			}

			if (hrp.Health > 0) {
				vehicleSeat.Sit(hrp);
			}
		}

		for (const block of blocksChildren) {
			ServerPartUtils.switchDescendantsAnchor(block, false);
			if (this.playerData.get(player.UserId).settings?.physics?.advanced_aerodynamics) {
				ServerPartUtils.switchDescendantsAero(block, true);
			}
		}

		for (const block of blocksChildren) {
			ServerPartUtils.switchDescendantsNetworkOwner(block, player);
		}

		// TODO: move this somewhere
		for (const block of blocksChildren) {
			if (BlockManager.manager.id.get(block) === "anchorblock") {
				ServerPartUtils.switchDescendantsAnchor(block, true);
			}
		}

		this.initializePhysics(player, controller.blocks.getBlocks());

		return { success: true };
	}
	private rideStop(player: Player): Response {
		const controller = this.serverControllers.controllers.get(player.UserId)?.plotController;
		if (!controller) throw "what";

		controller.blocks.deleteOperation.execute("all");

		const blocksToLoad = this.slots.getBlocks(player.UserId, SlotsMeta.lastRunSlotIndex);
		BlocksSerializer.deserializeFromObject(blocksToLoad, controller.blocks, this.blockList);

		return { success: true };
	}
}
