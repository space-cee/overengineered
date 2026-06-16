import { Colors } from "engine/shared/Colors";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { inferEnumLogicType } from "shared/blockLogic/BlockLogicTypes";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

// Base definition for regular lamps
const baseDefinition = {
	input: {
		enabled: {
			displayName: "Enabled",
			tooltip: "Turns this lamp on/off",
			types: BlockConfigDefinitions.bool,
		},
		brightnessAffectsColor: {
			displayName: "Color affects brightness",
			tooltip: "Enable to make brightness affect the color of the block",
			types: {
				bool: {
					config: false,
				},
			},
		},
		brightness: {
			displayName: "Brightness",
			tooltip: "How bright the light is",
			types: {
				number: {
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 300,
					},
					config: 20,
				},
			},
		},
		color: {
			displayName: "Color",
			tooltip: "The color of the light and the block",
			types: {
				color: {
					config: Colors.white,
				},
			},
		},
		lightRange: {
			displayName: "Range",
			tooltip: "Strength of the light source",
			types: {
				number: {
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 140,
					},
					config: 20,
				},
			},
		},
		colorMixing: {
			displayName: "Color Priority",
			tooltip: "Method of determining the resulting color of this lamp",
			types: {
				enum: inferEnumLogicType({
					config: "paint",
					elementOrder: ["config", "paint", "mixed", "mul"],
					elements: {
						config: { displayName: "Config", tooltip: "Prioritize configured color over paint color" },
						paint: { displayName: "Paint", tooltip: "Prioritize paint color over configured color" },
						mixed: { displayName: "Mixed", tooltip: "Mix configured and paint colors evenly" },
						mul: { displayName: "Multiplication", tooltip: "Multiply configured and paint colors" },
					},
				}),
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

// Specialized definition for spotlights (includes angle)
const spotlightDefinition = {
	input: {
		...baseDefinition.input,
		angle: {
			displayName: "Angle",
			tooltip: "Angle of the spotlight beam",
			types: {
				number: {
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 180,
					},
					config: 45,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type lampBlock = BlockModel & {
	GlowingPart: BasePart & {
		Light: Light;
	};
};

const update = ({ block, state, color, brightness, range, angle, brightnessAffectsColor }: UpdateData) => {
	const part = block.FindFirstChild("GlowingPart") as typeof block.GlowingPart;
	if (!part) return;

	const light = part.FindFirstChild("Light") as PointLight | SpotLight | undefined;
	if (!light) return;

	if (state) {
		let commonColor = color ?? Colors.white;
		if (brightnessAffectsColor) commonColor = Colors.black.Lerp(commonColor, math.clamp(brightness + 0.2, 0, 1));

		light.Range = range;
		part.Color = commonColor;
		light.Color = commonColor;
		part.Material = Enum.Material.Neon;
		light.Brightness = brightness * 10;

		if (light.IsA("SpotLight") && angle !== undefined) {
			light.Angle = angle;
		}
		return;
	}

	part.Color = Color3.fromRGB(0, 0, 0);
	part.Material = Enum.Material.SmoothPlastic;
	light.Brightness = 0;
};

const updateEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<lampBlock>(),
	state: t.boolean,
	color: t.color.orUndefined(),
	brightness: t.numberWithBounds(0, 100),
	range: t.numberWithBounds(0, 100),
	brightnessAffectsColor: t.boolean,
});

const updateEventTypeSpotlight = t.interface({
	block: t.instance("Model").nominal("blockModel").as<lampBlock>(),
	state: t.boolean,
	color: t.color.orUndefined(),
	brightness: t.numberWithBounds(0, 100),
	range: t.numberWithBounds(0, 100),
	angle: t.number,
	brightnessAffectsColor: t.boolean,
});

type UpdateData = t.Infer<typeof updateEventType> & { angle?: number };

const events = {
	update: new BlockSynchronizer("b_lamp_update", updateEventType, update),
	updateSpotlight: new BlockSynchronizer("b_spotlight_update", updateEventTypeSpotlight, update),
} as const;

const colorFunctions: Record<
	"config" | "paint" | "mixed" | "mul",
	(configColor: Color3, blockColor: Color3) => Color3
> = {
	config: (configColor, _) => configColor,
	paint: (_, blockColor) => blockColor,
	mixed: (configColor, blockColor) => configColor.Lerp(blockColor, 0.5),
	mul: (configColor, blockColor) => {
		const redSum = configColor.R * blockColor.R;
		const greenSum = configColor.G * blockColor.G;
		const blueSum = configColor.B * blockColor.B;
		const combinedColorValue = (redSum + greenSum + blueSum) / 255;

		return Color3.fromRGB(redSum / combinedColorValue, greenSum / combinedColorValue, blueSum / combinedColorValue);
	},
};

export class LampBlockLogic extends InstanceBlockLogic<typeof baseDefinition, lampBlock> {
	constructor(args: InstanceBlockLogicArgs) {
		super(baseDefinition, args);
		const blockColor = BlockManager.manager.color.get(args.instance).color;

		this.on(({ enabled, brightness, lightRange, color, colorMixing, brightnessAffectsColor }) => {
			const finalColor = colorFunctions[colorMixing as keyof typeof colorFunctions](color, blockColor);

			events.update.sendOrBurn(
				{
					block: this.instance,
					state: enabled,
					color: finalColor,
					brightness: brightness * 0.2,
					range: lightRange * 0.6,
					brightnessAffectsColor,
				},
				this,
			);
		});
	}
}

export class SpotlightBlockLogic extends InstanceBlockLogic<typeof spotlightDefinition, lampBlock> {
	constructor(args: InstanceBlockLogicArgs) {
		super(spotlightDefinition, args);
		const blockColor = BlockManager.manager.color.get(args.instance).color;

		this.on(({ enabled, brightness, lightRange, color, colorMixing, brightnessAffectsColor, angle }) => {
			const finalColor = colorFunctions[colorMixing as keyof typeof colorFunctions](color, blockColor);

			events.updateSpotlight.sendOrBurn(
				{
					block: this.instance,
					state: enabled,
					color: finalColor,
					brightness: brightness * 0.2,
					range: lightRange * 0.6,
					angle,
					brightnessAffectsColor,
				},
				this,
			);
		});
	}
}

const search = { aliases: ["moth"], partialAliases: ["light", "glow"] };

const baseLogicInfo: BlockLogicInfo = {
	definition: baseDefinition,
	ctor: LampBlockLogic,
	events: { update: events.update },
};

const spotlightLogicInfo: BlockLogicInfo = {
	definition: spotlightDefinition,
	ctor: SpotlightBlockLogic,
	events: { update: events.updateSpotlight },
};

const list: BlockBuildersWithoutIdAndDefaults = {
	lamp: {
		displayName: "Lamp",
		description: "A simple lamp. Turns on and off, or doesn't.",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
		logic: baseLogicInfo,
		search,
	},
	smalllamp: {
		displayName: "Small Lamp",
		description: "A simple lamp but even simpler!",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
		logic: baseLogicInfo,
		search,
	},
	cylinderlamp: {
		displayName: "Cylinder Lamp",
		description: "Uranium.",
		logic: baseLogicInfo,
		search,
	},
	hollowcylinderlamp: {
		displayName: "Hollow Cylinder Lamp",
		description: "Nighty night.",
		logic: baseLogicInfo,
		search,
	},
	balllamp: {
		displayName: "Ball Lamp",
		description: "Glowy ball",
		logic: baseLogicInfo,
		search,
	},
	halfballlamp: {
		displayName: "Half Ball Lamp",
		description: "Glowy ball, but cut in half.",
		logic: baseLogicInfo,
		search,
	},
	spotlight: {
		displayName: "Spotlight",
		description: "Directional lamp.",
		logic: spotlightLogicInfo,
		search,
	},
};

export const LampBlocks = BlockCreation.arrayFromObject(list);
