import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { EventHandler } from "engine/shared/event/EventHandler";
import { A2SRemoteEvent, S2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const LIMB_TARGETS = {
	leftHand: {
		displayName: "Left Hand",
		tooltip: "Attach to left hand",
	},
	rightHand: {
		displayName: "Right Hand",
		tooltip: "Attach to right hand",
	},
	leftFoot: {
		displayName: "Left Foot",
		tooltip: "Attach to left foot",
	},
	rightFoot: {
		displayName: "Right Foot",
		tooltip: "Attach to right foot",
	},
} as const;

type LimbTarget = keyof typeof LIMB_TARGETS;

const definition = {
	input: {
		attachToLimb: {
			displayName: "Attach To",
			tooltip: "Which hand or foot to attach the block to",
			types: {
				enum: {
					config: "leftHand" as LimbTarget,
					elementOrder: ["leftHand", "rightHand", "leftFoot", "rightFoot"],
					elements: LIMB_TARGETS,
				},
			},
			connectorHidden: true,
		},

		detachKey: {
			displayName: "Attach/Detach Key",
			tooltip: "Keyboard keybind to attach or detach the limb mount.",
			types: {
				key: {
					config: "H" as KeyCode,
				},
			},
			connectorHidden: true,
		},

		detachBool: {
			displayName: "Attach/Detach Wire",
			tooltip: "Plug a true/false boolean wire signal into this port.",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: false,
			connectorHidden: false,
		},

		shared: {
			displayName: "Shared",
			tooltip: "Allows other players to wear your limb mount.",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		mounted: {
			displayName: "Occupied",
			tooltip: "Returns true if player is mounted",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type LimbMountModel = BlockModel & {
	ProximityPrompt: ProximityPrompt;
	mainPart: BasePart;
	PlayerWeldConstraint: Motor6D;
};

const MAX_PROMPT_VISIBILITY_DISTANCE = 5;
const MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED = 15;

const owners = new Map<LimbMountModel, Player | undefined>();

const updateWeld = (
	caller: Player,
	owner: Player,
	block: LimbMountModel,
	attachTo: LimbTarget,
	forcedState?: boolean,
) => {
	const weldOwner = owners.get(block);

	let targetState: boolean;
	if (forcedState !== undefined) {
		targetState = forcedState;
	} else {
		targetState = weldOwner === undefined;
	}

	if (!targetState) {
		owners.set(block, undefined);
	} else {
		owners.set(block, caller);
	}

	Logic.events.weldMountUpdate.send({
		block,
		weldedState: targetState,
		owner,
		attachTo,
	});
};

const ownerSideInit = ({ block, key, owner, attachTo }: proximityInferedType, pp: ProximityPrompt) => {
	const k = Enum.KeyCode[key as unknown as never];
	const isUnknownKeybind = k === Enum.KeyCode.Unknown;

	const player = Players.LocalPlayer;
	const mainPart = block.FindFirstChild("mainPart") as BasePart;
	if (!mainPart) return;

	const handler = new EventHandler();

	handler.subscribe(block.DescendantRemoving, () => handler.unsubscribeAll());
	handler.subscribe(pp.Triggered, () => updateWeld(player, owner, block, attachTo as LimbTarget));

	handler.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
		if (gameProcessed) return;
		if (isUnknownKeybind) return;
		if (input.KeyCode !== k) return;

		updateWeld(player, owner, block, attachTo as LimbTarget);
	});

	handler.subscribe(RunService.Heartbeat, () => {
		const weldOwner = owners.get(block);
		if (weldOwner !== player) return;

		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		const distance = camera.CFrame.Position.sub(mainPart.Position).Magnitude;
		pp.MaxActivationDistance = distance > MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED ? 0 : distance;
	});
};

const otherClientSideInit = ({ block, key, isPublic, owner, attachTo }: proximityInferedType, pp: ProximityPrompt) => {
	const k = Enum.KeyCode[key as unknown as never];
	const isUnknownKeybind = k === Enum.KeyCode.Unknown;

	const player = Players.LocalPlayer;
	const mainPart = block.FindFirstChild("mainPart") as BasePart;
	if (!mainPart) return;

	const handler = new EventHandler();

	handler.subscribe(block.DescendantRemoving, () => handler.unsubscribeAll());
	handler.subscribe(pp.Triggered, () => updateWeld(player, owner, block, attachTo as LimbTarget));

	handler.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
		if (gameProcessed) return;
		if (isUnknownKeybind) return;
		if (input.KeyCode !== k) return;
		if (owners.get(block) !== player) return;

		updateWeld(player, owner, block, attachTo as LimbTarget);
	});

	handler.subscribe(RunService.Heartbeat, () => {
		if (!isPublic) return;
		const weldOwner = owners.get(block);

		if (weldOwner === undefined) {
			pp.MaxActivationDistance = MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED;
			return;
		}

		if (weldOwner !== player) {
			pp.MaxActivationDistance = 0;
			return;
		}

		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		const distance = camera.CFrame.Position.sub(mainPart.Position).Magnitude;
		pp.MaxActivationDistance = distance > MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED ? 0 : distance;
	});
};

const updateProximity = (data: proximityInferedType) => {
	const block = data.block;
	const key = data.key;
	const pp = block.FindFirstChild("ProximityPrompt") as typeof block.ProximityPrompt;
	if (!pp) return;

	const k = Enum.KeyCode[key as unknown as never];
	const isUnknownKeybind = k === Enum.KeyCode.Unknown;

	block.DescendantRemoving.Connect(() => owners.delete(block));

	if (!isUnknownKeybind) {
		pp.KeyboardKeyCode = k;
		pp.GamepadKeyCode = k;
		pp.Enabled = true;
	} else pp.Enabled = false;

	if (data.owner === Players.LocalPlayer) {
		pp.Enabled = true;
		pp.MaxActivationDistance = MAX_PROMPT_VISIBILITY_DISTANCE;
		ownerSideInit(data, pp);
	} else {
		pp.Enabled = data.isPublic;
		pp.MaxActivationDistance = data.isPublic ? MAX_PROMPT_VISIBILITY_DISTANCE : 0;
		otherClientSideInit(data, pp);
	}
};

const proximityEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<LimbMountModel>(),
	attachTo: t.string,
	owner: t.any.as<Player>(),
	isPublic: t.boolean,
	key: t.string,
});

type proximityInferedType = t.Infer<typeof proximityEventType>;

type weldTypeEvent = {
	readonly block: LimbMountModel;
	readonly weldedState: boolean;
	readonly owner: Player;
	readonly attachTo: string;
};

type logicUpdateEvent = {
	readonly block: LimbMountModel;
	readonly weldedTo: Player | undefined;
};

export type { Logic as LimbMountBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, LimbMountModel> {
	static readonly events = {
		updateLogic: new S2CRemoteEvent<logicUpdateEvent>("limbmount_logic", "RemoteEvent"),
		weldMountUpdate: new A2SRemoteEvent<weldTypeEvent>("limbmount_weld", "RemoteEvent"),
		updateProximity: new BlockSynchronizer<proximityInferedType>(
			"limbmount_proximity",
			proximityEventType,
			updateProximity,
		),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onk(["detachKey", "shared", "attachToLimb"], ({ detachKey, shared, attachToLimb }) => {
			Logic.events.updateProximity.send({
				block: this.instance,
				key: detachKey,
				isPublic: shared,
				owner: Players.LocalPlayer,
				attachTo: attachToLimb,
			});
		});

		this.onk(["detachBool", "attachToLimb"], ({ detachBoolChanged, detachBool, attachToLimb }) => {
			if (!detachBoolChanged) return;
			updateWeld(Players.LocalPlayer, Players.LocalPlayer, this.instance, attachToLimb as LimbTarget, detachBool);
		});

		if (RunService.IsClient()) {
			this.event.subscribe(Logic.events.updateLogic.invoked, ({ block, weldedTo }) => {
				if (block !== this.instance) return;
				this.output.mounted.set("bool", !!weldedTo);
			});
		}
	}
}

Logic.events.updateLogic.invoked.Connect(({ block, weldedTo }) => {
	owners.set(block, weldedTo);
	const pp = block.FindFirstChild("ProximityPrompt") as typeof block.ProximityPrompt;
	if (!pp) return;
	pp.ActionText = weldedTo ? "Detach" : "Attach";
	pp.MaxActivationDistance = !weldedTo ? MAX_PROMPT_VISIBILITY_DISTANCE : 0;
});

export const LimbMountBlock = {
	...BlockCreation.defaults,
	id: "limbmount",
	displayName: "Limb Mount",
	description: "A mountable block you can attach specifically to hands or feet.",
	limit: 999999999999999,

	search: {
		partialAliases: ["hand", "foot", "limb", "glove", "boot"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
