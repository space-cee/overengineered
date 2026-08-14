import { RunService, Players } from "@rbxts/services";
import { C2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { PlayerInfo } from "engine/shared/PlayerInfo";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { SharedMachine } from "shared/blockLogic/SharedMachine";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const definition = {
	input: {
		lock: {
			displayName: "Lock",
			types: {
				bool: { config: false },
			},
		},
		sittable: {
			displayName: "Sittable",
			types: {
				bool: { config: true },
			},
		},
	},
	output: {
		occupied: {
			displayName: "Occupied",
			types: ["bool"],
		},
		occupant: {
			displayName: "Occupant Name",
			types: ["string"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type VehicleSeatModel = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};

export { Logic as VehicleSeatBlocksLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, VehicleSeatModel> {
	private static readonly originalJump = new Map<Humanoid, { useJumpPower: boolean; jumpHeight: number }>();

	static setJumpLock(humanoid: Humanoid | undefined, locked = false) {
		if (!humanoid) return;

		if (!locked) {
			const original = Logic.originalJump.get(humanoid);
			if (!original) return;

			Logic.originalJump.delete(humanoid);
			humanoid.UseJumpPower = original.useJumpPower;
			humanoid.JumpHeight = original.jumpHeight;
			return;
		}

		if (!Logic.originalJump.has(humanoid)) {
			Logic.originalJump.set(humanoid, {
				useJumpPower: humanoid.UseJumpPower,
				jumpHeight: humanoid.JumpHeight,
			});
			humanoid.Destroying.Once(() => Logic.originalJump.delete(humanoid));
		}

		humanoid.UseJumpPower = false;
		humanoid.JumpHeight = 0;
	}

	static readonly events = {
		sittable: new C2SRemoteEvent<{ readonly block: VehicleSeatModel; sittable: boolean }>("vehicleseat_sittable"),
	} as const;
	readonly vehicleSeat;

	constructor(block: InstanceBlockLogicArgs, @inject machine: SharedMachine, @inject playerInfo: PlayerInfo) {
		super(definition, block);

		this.vehicleSeat = this.instance.VehicleSeat;
		const lockCache = this.initializeInputCache("lock");

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(this.vehicleSeat, "Occupant"),
			(occupant) => {
				this.output.occupied.set("bool", occupant !== undefined);
				if (!occupant) {
					this.output.occupant.unset();
					Logic.setJumpLock(playerInfo.humanoid.get());
					return;
				}
				const player = Players.GetPlayerFromCharacter(occupant.Parent as Model);
				if (player) this.output.occupant.set("string", player.Name);
				if (player === Players.LocalPlayer) {
					Logic.setJumpLock(occupant, lockCache.tryGet() ?? false);
				}
			},
			true,
		);

		this.onk(["sittable"], ({ sittable }) => {
			this.vehicleSeat.Disabled = !sittable;
			if (RunService.IsClient()) Logic.events.sittable.send({ block: this.instance, sittable });
		});

		if (!RunService.IsClient()) return;

		this.onDisable(() => {
			Logic.setJumpLock(this.vehicleSeat.Occupant);
			Logic.setJumpLock(playerInfo.humanoid.get());
		});

		this.onk(["lock"], ({ lock }) => {
			const occupant = this.vehicleSeat.Occupant;
			if (!occupant || occupant !== playerInfo.humanoid.get()) return;

			Logic.setJumpLock(occupant, lock);
		});

		// This event is only registered seperately because it doesn't run immediately
		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(this.vehicleSeat, "Occupant"),
			(oc) => machine.occupiedByLocalPlayer.set(oc?.Parent === Players.LocalPlayer.Character),
		);
	}
}

const list: BlockBuildersWithoutIdAndDefaults = {
	vehicleseat: {
		displayName: "Driver seat",
		description: "A seat for your vehicle. Allows you to control your contraption",
		limit: 1,
		search: { partialAliases: ["vehicle"] },

		logic: { definition, ctor: Logic },
	},
	armlessvehicleseat: {
		displayName: "Armless Driver seat",
		description: "A sleek, armless driver seat for your vehicle configurations",
		limit: 1,
		search: { partialAliases: ["vehicle", "armless"] },

		logic: { definition, ctor: Logic },
	},
};

export const VehicleSeatBlocks = BlockCreation.arrayFromObject(list);
