import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { EventHandler } from "engine/shared/event/EventHandler";
import { A2SRemoteEvent, S2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		detachKey: {
			displayName: "Attach/Detach Key",
			tooltip: "Keyboard keybind to attach or detach the head mount.",
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
			tooltip: "Allows other players to wear your head mount.",
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

type HeadMountModel = BlockModel & {
	ProximityPrompt: ProximityPrompt;
	mainPart: BasePart;
	PlayerWeldConstraint: Motor6D;
};

const MAX_PROMPT_VISIBILITY_DISTANCE = 5;
const MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED = 15;

const owners = new Map<HeadMountModel, Player | undefined>();

const updateWeld = (caller: Player, owner: Player, block: HeadMountModel, forcedState?: boolean) => {
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
	});
};

const ownerSideInit = ({ block, key, owner }: proximityInferedType, pp: ProximityPrompt) => {
	const k = Enum.KeyCode[key as unknown as never];
	const isUnknownKeybind = k === Enum.KeyCode.Unknown;

	const player = Players.LocalPlayer;
	const mainPart = block.FindFirstChild("mainPart") as BasePart;
	if (!mainPart) return;

	const handler = new EventHandler();

	handler.subscribe(block.DescendantRemoving, () => handler.unsubscribeAll());
	handler.subscribe(pp.Triggered, () => updateWeld(player, owner, block));

	handler.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
		if (gameProcessed) return;
		if (isUnknownKeybind) return;
		if (input.KeyCode !== k) return;

		updateWeld(player, owner, block);
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

const otherClientSideInit = ({ block, key, isPublic, owner }: proximityInferedType, pp: ProximityPrompt) => {
	const k = Enum.KeyCode[key as unknown as never];
	const isUnknownKeybind = k === Enum.KeyCode.Unknown;

	const player = Players.LocalPlayer;
	const mainPart = block.FindFirstChild("mainPart") as BasePart;
	if (!mainPart) return;

	const handler = new EventHandler();

	handler.subscribe(block.DescendantRemoving, () => handler.unsubscribeAll());
	handler.subscribe(pp.Triggered, () => updateWeld(player, owner, block));

	handler.subscribe(UserInputService.InputBegan, (input, gameProcessed) => {
		if (gameProcessed) return;
		if (isUnknownKeybind) return;
		if (input.KeyCode !== k) return;
		if (owners.get(block) !== player) return;

		updateWeld(player, owner, block);
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
	block: t.instance("Model").nominal("blockModel").as<HeadMountModel>(),
	owner: t.any.as<Player>(),
	isPublic: t.boolean,
	key: t.string,
});

type proximityInferedType = t.Infer<typeof proximityEventType>;

type weldTypeEvent = {
	readonly block: HeadMountModel;
	readonly weldedState: boolean;
	readonly owner: Player;
};

type logicUpdateEvent = {
	readonly block: HeadMountModel;
	readonly weldedTo: Player | undefined;
};

export type { Logic as HeadMountBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, HeadMountModel> {
	static readonly events = {
		updateLogic: new S2CRemoteEvent<logicUpdateEvent>("headmount_logic", "RemoteEvent"),
		weldMountUpdate: new A2SRemoteEvent<weldTypeEvent>("headmount_weld", "RemoteEvent"),
		updateProximity: new BlockSynchronizer<proximityInferedType>(
			"headmount_proximity",
			proximityEventType,
			updateProximity,
		),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onk(["detachKey", "shared"], ({ detachKey, shared }) => {
			Logic.events.updateProximity.send({
				block: this.instance,
				key: detachKey,
				isPublic: shared,
				owner: Players.LocalPlayer,
			});
		});

		this.onk(["detachBool"], ({ detachBoolChanged, detachBool }) => {
			if (!detachBoolChanged) return;
			updateWeld(Players.LocalPlayer, Players.LocalPlayer, this.instance, detachBool);
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

export const HeadMountBlock = {
	...BlockCreation.defaults,
	id: "headmount",
	displayName: "Head Mount",
	description: "A mountable block that attaches straight onto your head.",
	limit: 999999999999999,

	search: {
		partialAliases: ["head", "hat", "helmet", "face", "mount"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
