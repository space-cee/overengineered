import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		input: {
			displayName: "Input",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: -999999999999999,
						max: 999999999999999,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								type: "smooth",
								instant: {
									mode: "onRelease",
								},
								smooth: {
									speed: 20,
									mode: "stopOnRelease",
								},
							},
							keys: [
								{ key: "W", value: 100 },
								{ key: "S", value: 0 },
							],
						},
					},
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		value: {
			displayName: "Output",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as ControllerBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);
		this.onRecalcInputs(({ input, inputType }) => this.output.value.set(inputType, input));
	}
}

export const ControllerBlock = {
	...BlockCreation.defaults,
	id: "controller",
	displayName: "Controller",
	description: "Like a rocket, but without the rocket. Controls your stuff through logic.",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("ConstLogicBlockPrefab", "CONTROLLER"),
		category: () => BlockCreation.Categories.sensor,
	},
} as const satisfies BlockBuilder;
