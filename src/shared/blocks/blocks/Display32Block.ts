import { RunService } from "@rbxts/services";
import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["posx", "posy", "color", "update", "reset", "suspendDraw"],
	input: {
		posx: {
			displayName: "Position X",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 31,
						step: 1,
					},
				},
			},
			configHidden: true,
		},
		posy: {
			displayName: "Position Y",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 31,
						step: 1,
					},
				},
			},
			configHidden: true,
		},
		color: {
			displayName: "Color",
			types: {
				vector3: {
					config: new Vector3(0, 0, 0),
				},
				color: {
					config: new Color3(0, 0, 0),
				},
			},
			configHidden: true,
		},
		update: {
			displayName: "Update",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		reset: {
			displayName: "Reset",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
		suspendDraw: {
			displayName: "Suspend drawing",
			tooltip: "If true, buffer pixel changes, and when this input is false, draw them all at once",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type cachedChange = [frame: Frame, color: Color3];

export type { Logic as Display32BlockLogic };

class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		prepare: new A2SRemoteEvent<{
			readonly block: BlockModel;
			readonly baseColor: Color3;
		}>("display32_prepare", "RemoteEvent"),

		update: new A2SRemoteEvent<{
			readonly block: BlockModel;
			readonly changes: readonly cachedChange[];
		}>("display32_update", "RemoteEvent"),

		fill: new A2SRemoteEvent<{
			readonly block: BlockModel;
			readonly color: Color3;
			readonly frames: Frame[][];
		}>("display32_fill", "RemoteEvent"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let cachedChanges = new Map<Frame, cachedChange>();
		let suspendBuffer = new Map<Frame, cachedChange>();

		const baseColor = this.definition.input.color.types.color.config;

		Logic.events.prepare.send({
			block: block.instance,
			baseColor,
		});

		const gui = block.instance.WaitForChild("Screen").WaitForChild("SurfaceGui");

		const display: Frame[][] = new Array(32);
		for (let x = 0; x < 32; x++) {
			display[x] = new Array(32);
			for (let y = 0; y < 32; y++) {
				display[x][y] = gui.WaitForChild(`x${x}y${y}`) as Frame;
			}
		}

		this.event.subscribe(RunService.Heartbeat, () => {
			if (cachedChanges.isEmpty()) return;

			Logic.events.update.send({
				block: block.instance,
				changes: cachedChanges.values(),
			});

			cachedChanges.clear();
		});

		this.on(({ posx, posy, color, update, suspendDraw }) => {
			if (!update) return;

			if (typeIs(color, "Vector3")) {
				color = Color3.fromRGB(color.X, color.Y, color.Z);
			}

			const target = suspendDraw ? suspendBuffer : cachedChanges;

			const frame = display[posx][posy];
			target.set(frame, [frame, color]);
		});

		this.onk(["suspendDraw"], ({ suspendDraw }) => {
			if (suspendDraw) return;
			if (suspendBuffer.isEmpty()) return;

			cachedChanges = suspendBuffer;
			suspendBuffer = new Map();
		});

		this.onk(["reset"], ({ reset }) => {
			if (!reset) return;

			Logic.events.fill.send({
				block: block.instance,
				color: baseColor,
				frames: display,
			});
		});
	}
}

export const Display32Block = {
	...BlockCreation.defaults,
	id: "display32",
	displayName: "Display 32",
	description: "Simple 32x32 pixel display. Wonder what can you do with it..",
	limit: 999999999999999,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
