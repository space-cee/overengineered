import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["damping", "stiffness", "free_length", "max_force", "color", "coils", "thickness"],
	input: {
		damping: {
			displayName: "Damping",
			types: {
				number: {
					config: 250,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 999_999,
						step: 0.01,
					},
				},
			},
			connectorHidden: false,
		},
		stiffness: {
			displayName: "Stiffness",
			types: {
				number: {
					config: 7_500,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 999_999,
						step: 0.01,
					},
				},
			},
			connectorHidden: false,
		},
		free_length: {
			displayName: "Free Length",
			types: {
				number: {
					config: 2,
					clamp: {
						showAsSlider: true,
						min: 0.1,
						max: 999999999999999,
						step: 0.01,
					},
				},
			},
		},
		max_force: {
			displayName: "Force",
			types: {
				number: {
					config: 25_000,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 999999999999999,
					},
				},
			},
		},
		color: {
			displayName: "Color",
			types: {
				color: {
					config: Color3.fromHex("#5B5D69"),
				},
			},
		},
		coils: {
			displayName: "Coils",
			types: {
				number: {
					config: 3,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 50,
						step: 1,
					},
				},
			},
		},
		thickness: {
			displayName: "Thickness",
			types: {
				number: {
					config: 0.25,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 10,
						step: 0.01,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type SuspensionModel = BlockModel & {
	readonly SpringSide: BasePart & {
		readonly SpringConstraint: SpringConstraint;
		readonly PrismaticConstraint: PrismaticConstraint;
	};
};

export type { Logic as SuspensionBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, SuspensionModel> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const springSide = this.instance.SpringSide;
		if (!springSide) return;
		const spring = springSide.SpringConstraint;

		const blockScale = BlockManager.manager.scale.get(block.instance) ?? Vector3.one;
		const scale = blockScale.X * blockScale.Y * blockScale.Z;
		const minScale = blockScale.findMin();
		const setSpringParameters = ({
			max_force,
			damping,
			stiffness,
			free_length,
			color,
			coils,
			thickness,
		}: {
			max_force?: number;
			damping?: number;
			stiffness?: number;
			free_length?: number;
			color?: Color3;
			coils?: number;
			thickness?: number;
		}) => {
			if (!spring) return;

			if (
				max_force === undefined ||
				damping === undefined ||
				stiffness === undefined ||
				free_length === undefined
			) {
				return;
			}

			const len = free_length * blockScale.Y;

			spring.MaxForce = max_force * scale;
			spring.Damping = damping * scale;
			spring.Stiffness = stiffness * scale;
			spring.FreeLength = len;
			spring.MaxLength = len * 2;
			spring.MinLength = 0.1;
			spring.Radius = minScale * 0.6;

			if (color !== undefined) {
				spring.Color = new BrickColor(color);
			}

			if (coils !== undefined) {
				spring.Coils = coils;
			}

			if (thickness !== undefined) {
				spring.Thickness = thickness * minScale;
			}
		};

		this.onkFirstInputs(["damping", "free_length", "max_force", "stiffness"], setSpringParameters);
		this.on(setSpringParameters);
	}
}

export const SuspensionBlock = {
	...BlockCreation.defaults,
	id: "suspensionblock",
	displayName: "Suspension",
	description: "Sus pension spring",

	search: {
		aliases: ["sus", "spring", "coil"],
	},

	logic: {
		definition,
		ctor: Logic,
		immediate: (model) => {
			const springSide = model.FindFirstChild("SpringSide") as BasePart | undefined;
			const spring = springSide?.FindFirstChildOfClass("SpringConstraint");
			if (!spring) return;
			const blockScale = BlockManager.manager.scale.get(model) ?? Vector3.one;
			const minScale = math.min(blockScale.X, blockScale.Y, blockScale.Z);
			const config = BlockManager.manager.config.get(model);
			const inputs = config?.inputs as Record<string, unknown> | undefined;
			const rawThickness = (inputs?.thickness as number | undefined) ?? 0.25;
			const rawFreeLength = (inputs?.free_length as number | undefined) ?? 2;
			spring.Radius = minScale * 0.6;
			spring.Thickness = rawThickness * minScale;
			spring.FreeLength = rawFreeLength * blockScale.Y;
		},
	},
} as const satisfies BlockBuilder;
