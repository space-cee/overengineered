import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		length: {
			displayName: "Length",
			types: {
				number: {
					config: 15,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 999999999999999,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type RopeModel = BlockModel & {
	readonly RopeSide: BasePart & {
		readonly RopeConstraint: RopeConstraint;
	};
};

export type { Logic as RopeBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, RopeModel> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const ropeConstraint = this.instance.RopeSide.RopeConstraint;
		this.on(({ length }) => (ropeConstraint.Length = length));
	}
}

export const RopeBlock = {
	...BlockCreation.defaults,
	id: "rope",
	displayName: "Rope",
	description: "A very VERY robust rope",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
