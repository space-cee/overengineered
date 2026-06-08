import { RunService } from "@rbxts/services";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type {
	BlockLogicFullBothDefinitions,
	BlockLogicFullInputDef,
	InstanceBlockLogicArgs,
} from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const defaultParticleID = "14198353638";

namespace ParticleEmitter {
	const definition = {
		input: {
			particle: {
				displayName: "Configured particle",
				types: {
					particle: {
						config: {
							particleID: defaultParticleID,
						},
					},
				},
				configHidden: true,
			},
			enabled: {
				displayName: "Enabled",
				types: {
					bool: {
						config: true,
					},
				},
			},
			emit: {
				// this was added
				displayName: "Emit",
				types: {
					bool: {
						config: false,
					},
				},
			},
		},
		output: {},
	} satisfies BlockLogicFullBothDefinitions;

	type particleEmitter = BlockModel & {
		Body: {
			ParticleEmitter: ParticleEmitter;
		};
	};

	type UpdateData = t.Infer<typeof updateDataType>;
	const updateDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
		properties: t.any.as<BlockLogicTypes.ParticleValue>(),
	});

	type EmitData = t.Infer<typeof emitDataType>;
	const emitDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
	});

	type EnableData = t.Infer<typeof enableDataType>;
	const enableDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
		enabled: t.boolean,
	});

	const updateParametersFunc = ({ properties, block }: UpdateData) => {
		const emitter = block.Body.ParticleEmitter;
		emitter.Texture = `rbxassetid://${properties.particleID}`;
		if (properties.rate) {
			emitter.Rate = properties.rate;
		}

		if (properties.flipbookLayout && properties.flipbookLayout !== "None") {
			emitter.FlipbookLayout = Enum.ParticleFlipbookLayout[properties.flipbookLayout as never];
			if (properties.flipbookMode) {
				emitter.FlipbookMode = Enum.ParticleFlipbookMode[properties.flipbookMode as never];
			}
			if (properties.flipbookStartRandom !== undefined) {
				emitter.FlipbookStartRandom = properties.flipbookStartRandom;
			}
			if (properties.flipbookFramerate) {
				emitter.FlipbookFramerate = new NumberRange(properties.flipbookFramerate);
			}
		}

		if (properties.speed) {
			emitter.Speed = new NumberRange(properties.speed);
		}
		if (properties.acceleration) {
			emitter.Acceleration = properties.acceleration;
		}

		const color1 = properties.color ?? Colors.white;
		const color2 = properties.color2 ?? color1;
		const colorFadeMode = properties.colorFadeMode ?? "None";
		const lifetime = properties.lifetime ?? 5;
		const colorFadeDuration = math.clamp(properties.colorFadeDuration ?? 0.5, 0, lifetime);
		const colorFadePercent = lifetime > 0 ? colorFadeDuration / lifetime : 0;

		if (colorFadeMode === "FadeIn") {
			emitter.Color = new ColorSequence([
				new ColorSequenceKeypoint(0, color1),
				new ColorSequenceKeypoint(colorFadePercent, color2),
				new ColorSequenceKeypoint(1, color2),
			]);
		} else if (colorFadeMode === "FadeOut") {
			emitter.Color = new ColorSequence([
				new ColorSequenceKeypoint(0, color2),
				new ColorSequenceKeypoint(1 - colorFadePercent, color2),
				new ColorSequenceKeypoint(1, color1),
			]);
		} else if (colorFadeMode === "FadeInOut") {
			const halfFade = math.clamp(colorFadePercent, 0, 0.5);
			emitter.Color = new ColorSequence([
				new ColorSequenceKeypoint(0, color1),
				new ColorSequenceKeypoint(halfFade, color2),
				new ColorSequenceKeypoint(1 - halfFade, color2),
				new ColorSequenceKeypoint(1, color1),
			]);
		} else if (colorFadeMode === "Switch") {
			const switchTime = math.clamp(properties.colorFadeDuration ?? 0.5, 0.05, lifetime);
			const switchCount = math.max(1, math.floor(lifetime / switchTime));
			const keypoints: ColorSequenceKeypoint[] = [];
			let currentColor = color1;
			for (let i = 0; i <= switchCount; i++) {
				keypoints.push(new ColorSequenceKeypoint(i / switchCount, currentColor));
				currentColor = currentColor === color1 ? color2 : color1;
			}
			emitter.Color = new ColorSequence(keypoints);
		} else {
			emitter.Color = new ColorSequence(color1);
		}

		if (properties.lifetime) {
			emitter.Lifetime = new NumberRange(properties.lifetime * 0.95, properties.lifetime * 1.05);
		}
		if (properties.rotation) {
			emitter.Rotation = new NumberRange(properties.rotation);
		}
		if (properties.rotationSpeed) {
			emitter.RotSpeed = new NumberRange(properties.rotationSpeed);
		}
		if (properties.squash) {
			emitter.Squash = new NumberSequence(properties.squash);
		}

		const transparency1 = properties.transparency ?? 0;
		const transparency2 = properties.transparency2 ?? transparency1;
		const transparencyFadeMode = properties.fadeMode ?? "None";
		const transparencyFadeDuration = math.clamp(properties.fadeDuration ?? 0.5, 0, lifetime);
		const transparencyFadePercent = lifetime > 0 ? transparencyFadeDuration / lifetime : 0;

		if (transparencyFadeMode === "FadeIn") {
			emitter.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, 1),
				new NumberSequenceKeypoint(transparencyFadePercent, transparency1),
				new NumberSequenceKeypoint(1, transparency1),
			]);
		} else if (transparencyFadeMode === "FadeOut") {
			emitter.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, transparency2),
				new NumberSequenceKeypoint(1 - transparencyFadePercent, transparency2),
				new NumberSequenceKeypoint(1, transparency1),
			]);
		} else if (transparencyFadeMode === "FadeInOut") {
			const halfFade = math.clamp(transparencyFadePercent, 0, 0.5);
			emitter.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, transparency1),
				new NumberSequenceKeypoint(halfFade, transparency2),
				new NumberSequenceKeypoint(1 - halfFade, transparency2),
				new NumberSequenceKeypoint(1, transparency1),
			]);
		} else if (transparencyFadeMode === "Switch") {
			const switchTime = math.clamp(properties.fadeDuration ?? 0.5, 0.05, lifetime);
			const switchCount = math.max(1, math.floor(lifetime / switchTime));
			const keypoints: NumberSequenceKeypoint[] = [];
			let currentTransparency = transparency1;
			for (let i = 0; i <= switchCount; i++) {
				keypoints.push(new NumberSequenceKeypoint(i / switchCount, currentTransparency));
				currentTransparency = currentTransparency === transparency1 ? transparency2 : transparency1;
			}
			emitter.Transparency = new NumberSequence(keypoints);
		} else {
			emitter.Transparency = new NumberSequence(transparency1);
		}

		if (properties.spreadAngle) {
			emitter.SpreadAngle = new Vector2(properties.spreadAngle.X, properties.spreadAngle.Y);
		}
		if (properties.velocityInheritance) {
			emitter.VelocityInheritance = properties.velocityInheritance;
		}
		if (properties.lockedToPart) {
			emitter.LockedToPart = properties.lockedToPart;
		}
		if (properties.orientation) {
			emitter.Orientation = Enum.ParticleOrientation[properties.orientation as never];
		}
		if (properties.brightness) {
			emitter.Brightness = properties.brightness;
		}
		if (properties.timeScale) {
			emitter.TimeScale = properties.timeScale;
		}

		const size1 = properties.size ?? 1;
		const size2 = properties.size2 ?? size1;
		const sizeFadeMode = properties.sizeFadeMode ?? "None";
		const sizeFadeDuration = math.clamp(properties.sizeFadeDuration ?? 0.5, 0, lifetime);
		const sizeFadePercent = lifetime > 0 ? sizeFadeDuration / lifetime : 0;

		if (sizeFadeMode === "FadeIn") {
			emitter.Size = new NumberSequence([
				new NumberSequenceKeypoint(0, size1),
				new NumberSequenceKeypoint(sizeFadePercent, size2),
				new NumberSequenceKeypoint(1, size2),
			]);
		} else if (sizeFadeMode === "FadeOut") {
			emitter.Size = new NumberSequence([
				new NumberSequenceKeypoint(0, size2),
				new NumberSequenceKeypoint(1 - sizeFadePercent, size2),
				new NumberSequenceKeypoint(1, size1),
			]);
		} else if (sizeFadeMode === "FadeInOut") {
			const halfFade = math.clamp(sizeFadePercent, 0, 0.5);
			emitter.Size = new NumberSequence([
				new NumberSequenceKeypoint(0, size1),
				new NumberSequenceKeypoint(halfFade, size2),
				new NumberSequenceKeypoint(1 - halfFade, size2),
				new NumberSequenceKeypoint(1, size1),
			]);
		} else if (sizeFadeMode === "Switch") {
			const switchTime = math.clamp(properties.sizeFadeDuration ?? 0.5, 0.05, lifetime);
			const switchCount = math.max(1, math.floor(lifetime / switchTime));
			const keypoints: NumberSequenceKeypoint[] = [];
			let currentSize = size1;
			for (let i = 0; i <= switchCount; i++) {
				keypoints.push(new NumberSequenceKeypoint(i / switchCount, currentSize));
				currentSize = currentSize === size1 ? size2 : size1;
			}
			emitter.Size = new NumberSequence(keypoints);
		} else {
			emitter.Size = new NumberSequence(size1);
		}

		if (properties.drag) {
			emitter.Drag = properties.drag;
		}
		if (properties.emissionDirection) {
			emitter.EmissionDirection = Enum.NormalId[properties.emissionDirection as never];
		}
		if (properties.shape) {
			emitter.Shape = Enum.ParticleEmitterShape[properties.shape as never];
		}
		if (properties.shapeInOut) {
			emitter.ShapeInOut = Enum.ParticleEmitterShapeInOut[properties.shapeInOut as never];
		}
		if (properties.shapeStyle) {
			emitter.ShapeStyle = Enum.ParticleEmitterShapeStyle[properties.shapeStyle as never];
		}
		if (properties.zOffset !== undefined) {
			emitter.ZOffset = properties.zOffset;
		}
	};

	const emitState = ({ block }: EmitData) => {
		const emitter = block.Body.ParticleEmitter;
		emitter.Emit(1);
	};

	const enableState = ({ block, enabled }: EnableData) => {
		const emitter = block.Body.ParticleEmitter;
		emitter.Enabled = enabled;
	};

	export class Logic extends InstanceBlockLogic<typeof definition, particleEmitter> {
		static readonly events = {
			updateParameters: new BlockSynchronizer<UpdateData>(
				"particle_update",
				updateDataType,
				updateParametersFunc,
			),
			emit: new BlockSynchronizer<EmitData>("particle_emit", emitDataType, emitState),
			enable: new BlockSynchronizer<EnableData>("particle_enable", enableDataType, enableState),
		} as const;

		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			const emitNode = this.initializeInputCache("emit");

			this.event.subscribe(RunService.Heartbeat, () => {
				if (!updateNextTick) return;
				updateNextTick = false;
				if (emitNode.get()) Logic.events.emit.send({ block: this.instance });
			});

			let updateNextTick = false;
			this.onTicc(() => (updateNextTick = true));

			this.onk(["enabled"], ({ enabled }) =>
				Logic.events.enable.sendOrBurn(
					{
						block: this.instance,
						enabled,
					},
					this,
				),
			);

			this.onk(["particle"], ({ particle }) =>
				Logic.events.updateParameters.sendOrBurn(
					{
						block: this.instance,
						properties: particle,
					},
					this,
				),
			);

			this.onDisable(() => {
				Logic.events.enable.sendOrBurn({ block: this.instance, enabled: false }, this);
			});
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: "particleemitter",
		displayName: "Particle Emitter",
		description: `Spawns various prepared particles.`,

		limit: 999999999999999,

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace ParticleCreator {
	const cnum = (config: number) => ({ number: { config } });
	const cnumrange = (config: number, min: number, max: number) => ({
		number: {
			config,
			clamp: {
				min,
				max,
				step: 0.01,
				showAsSlider: true,
			},
		},
	});
	const cnumrangeMinMax = (config: number, min: number, max: number, step: number) => ({
		number: {
			config,
			clamp: {
				min,
				max,
				step,
				showAsSlider: true,
			},
		},
	});
	const defaultNum = cnum(0);
	const defaultBool = { bool: { config: false } };
	const defaultVec = { vector3: { config: Vector3.zero } };
	const defaultNumRange = cnumrange(0, 0, 1);

	const stringIdType = {
		string: {
			config: defaultParticleID,
		},
	};

	const inpCreate = (displayName: string, description: string, types: BlockLogicFullInputDef["types"]) => ({
		displayName,
		description,
		types,
	});

	const enumOptionGenerate = (base: string, options: string[]) => {
		const res: Record<string, { displayName: string }> = {};
		for (const v of options) res[v] = { displayName: `${base} ${v}` };
		return res;
	};

	const definition = {
		inputOrder: [
			"particleID",

			"color",
			"color2",
			"colorFadeMode",
			"colorFadeDuration",

			"size",
			"size2",
			"sizeFadeMode",
			"sizeFadeDuration",

			"speed",
			"rate",
			"lifetime",
			"rotation",
			"rotationSpeed",

			"transparency",
			"transparency2",
			"fadeMode",
			"fadeDuration",

			"orientation",
			"squash",
			"acceleration",
			"spreadAngle",
			"velocityInheritance",

			"flipbookLayout",
			"flipbookFramerate",
			"flipbookMode",
			"flipbookStartRandom",

			"timeScale",
			"brightness",
			"drag",
			"lockedToPart",

			"emissionDirection",
			"shape",
			"shapeInOut",
			"shapeStyle",

			"zOffset",
		] as const satisfies (keyof BlockLogicTypes.ParticleValue | "particleID")[],
		input: {
			particleID: inpCreate("Particle", "ID of the particle.", stringIdType),
			rotation: inpCreate("Rotation", "The rotation. Speaks for itself", defaultNum),
			rotationSpeed: inpCreate("Rotation Speed", "How fast your particles will rotate", defaultNum),
			transparency: inpCreate("Transparency", "It's like opaque-ness but the other way around", defaultNumRange),
			color: inpCreate("Color", "The color of the spawned particles", { color: { config: Colors.white } }),
			squash: inpCreate("Squash", "How squashed will the particles be", defaultNum),
			lifetime: inpCreate("Lifetime", "How long will your particle exist until despawning", cnum(5)),
			acceleration: inpCreate("Acceleration", "The acceleration of the spawned partice", defaultVec),
			speed: inpCreate("Particle Speed", "The speed. Ka-Chau.", cnum(2)),
			rate: inpCreate("Spawn Rate", "How often the particles will spawn", cnum(5)),
			brightness: inpCreate("Brightness", "How bright the particle's texture is", cnum(1)),
			size: inpCreate("Size", "The size of the partice", cnum(1)),
			drag: inpCreate("Drag", "How fast the particle will decelerate", defaultNum),
			velocityInheritance: inpCreate("Velocity Inheritance", "", defaultNum),
			timeScale: inpCreate("Time Scale", "The speed of animation of the particle.", cnumrange(1, 0, 1)),
			spreadAngle: inpCreate(
				"Spread Angle",
				"The direction particles will spread. Z-axis isn't used.",
				defaultVec,
			),
			lockedToPart: inpCreate(
				"Locked To Part",
				"Determines if the particle gets affected by the spawner's movement",
				defaultBool,
			),
			flipbookLayout: inpCreate("Flipbook Layout", "idk ask the internet", {
				enum: {
					config: "None",
					elements: {
						None: { displayName: "None" },
						Grid2x2: { displayName: "Grid 2x2" },
						Grid4x4: { displayName: "Grid 4x4" },
						Grid8x8: { displayName: "Grid 8x8" },
					},
					elementOrder: ["None", "Grid2x2", "Grid4x4", "Grid8x8"],
				},
			}),
			flipbookFramerate: inpCreate(
				"Flipbook Framerate",
				"The animation speed of the flipbook texture in frames per second",
				cnumrangeMinMax(20, 1, 60, 1),
			),

			flipbookMode: inpCreate("Flipbook Mode", "How the flipbook animation plays", {
				enum: {
					config: "Loop",
					elements: {
						Loop: { displayName: "Loop" },
						OneShot: { displayName: "One Shot" },
						PingPong: { displayName: "Ping Pong" },
						Random: { displayName: "Random" },
					},
					elementOrder: ["Loop", "OneShot", "PingPong", "Random"],
				},
			}),
			color2: inpCreate("Color 2", "Secondary color used for color fading", {
				color: {
					config: Colors.white,
				},
			}),

			colorFadeMode: inpCreate("Color Fade Mode", "Choose how the particle color changes over lifetime", {
				enum: {
					config: "None",
					elements: {
						None: { displayName: "None" },
						FadeIn: { displayName: "Fade To Color 2" },
						FadeOut: { displayName: "Fade From Color 2" },
						FadeInOut: { displayName: "Color 1 → 2 → 1" },
						Switch: { displayName: "Switch 1 ⇄ 2" },
					},
					elementOrder: ["None", "FadeIn", "FadeOut", "FadeInOut", "Switch"],
				},
			}),

			colorFadeDuration: inpCreate(
				"Color Fade Duration",
				"Time (seconds) used for color fade",
				cnumrange(0.5, 0, 10),
			),
			transparency2: inpCreate(
				"Transparency 2",
				"Secondary transparency used for fade/switch",
				cnumrange(1, 0, 1),
			),

			fadeMode: inpCreate("Fade Mode", "Choose how the particle fades over its lifetime", {
				enum: {
					config: "None",
					elements: {
						None: { displayName: "None" },
						FadeIn: { displayName: "Fade In" },
						FadeOut: { displayName: "Fade Out" },
						FadeInOut: { displayName: "Fade In & Out" },
						Switch: { displayName: "Switch Transparency" },
					},
					elementOrder: ["None", "FadeIn", "FadeOut", "FadeInOut", "Switch"],
				},
			}),

			fadeDuration: inpCreate("Fade Duration", "Time (seconds) used for fade", cnumrange(0.5, 0, 10)),

			size2: inpCreate("Size 2", "Secondary size used for size fading", cnum(1)),

			sizeFadeMode: inpCreate("Size Fade Mode", "Choose how the particle size changes over lifetime", {
				enum: {
					config: "None",
					elements: {
						None: { displayName: "None" },
						FadeIn: { displayName: "Grow To Size 2" },
						FadeOut: { displayName: "Shrink From Size 2" },
						FadeInOut: { displayName: "Size 1 → 2 → 1" },
						Switch: { displayName: "Switch 1 ⇄ 2" },
					},
					elementOrder: ["None", "FadeIn", "FadeOut", "FadeInOut", "Switch"],
				},
			}),

			sizeFadeDuration: inpCreate(
				"Size Fade Duration",
				"Time (seconds) used for size fade",
				cnumrange(0.5, 0, 10),
			),

			zOffset: inpCreate("Z Offset", "Offsets the particle forward/backward in rendering order", cnum(0)),

			flipbookStartRandom: inpCreate(
				"Flipbook Start Random",
				"If true, animation starts at a random frame",
				defaultBool,
			),
			orientation: inpCreate("Orientation", "Which way the paricle will be facing", {
				enum: {
					config: "FacingCamera",
					elements: {
						FacingCamera: { displayName: "Facing Camera" },
						FacingCameraWorldUp: { displayName: "Facing Camera World Up" },
						VelocityParallel: { displayName: "Velocity Parallel" },
						VelocityPerpendicular: { displayName: "Velocity Perpendicular" },
					},
					elementOrder: ["FacingCamera", "FacingCameraWorldUp", "VelocityParallel", "VelocityPerpendicular"],
				},
			}),
			emissionDirection: inpCreate("Emission Direction", "Which way the paricle will be facing", {
				enum: {
					config: "Top",
					elements: enumOptionGenerate("Emissions facing", [
						"Top",
						"Bottom",
						"Front",
						"Back",
						"Left",
						"Right",
					]),
					elementOrder: ["Top", "Bottom", "Front", "Back", "Left", "Right"],
				},
			}),
			shape: inpCreate("Emission Shape", "Kinda hard to explain. Check it out yourself.", {
				enum: {
					config: "Box",
					elements: enumOptionGenerate("Shape -", ["Box", "Cylinder", "Disc", "Sphere"]),
					elementOrder: ["Box", "Cylinder", "Disc", "Sphere"],
				},
			}),
			shapeInOut: inpCreate("Shape In/Out", "Determines if the particle will be emitted inwards or outwards", {
				enum: {
					config: "Outward",
					elements: enumOptionGenerate("Emits ", ["InAndOut", "Inward", "Outward"]),
					elementOrder: ["InAndOut", "Inward", "Outward"],
				},
			}),
			shapeStyle: inpCreate("Shape style", "Determines how particles will spread around", {
				enum: {
					config: "Volume",
					elements: enumOptionGenerate("Follow", ["Volume", "Surface"]),
					elementOrder: ["Volume", "Surface"],
				},
			}),
		} satisfies { [k in keyof BlockLogicTypes.ParticleValue]: BlockLogicFullInputDef },
		output: {
			output: {
				displayName: "Output particle",
				types: ["particle"],
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	class Logic extends InstanceBlockLogic<typeof definition> {
		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			this.on((arg) => {
				const res = {} as Record<string, unknown>;
				for (const [k, v] of pairs(this.definition.input)) {
					res[k] = arg[k];
				}
				this.output.output.set("particle", res as BlockLogicTypes.ParticleValue);
			});
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: `particlecreator`,
		displayName: `Particle Creator`,
		description: `Creates the particle. Pass the result of the configuration to ${ParticleEmitter.Block.displayName}!`,

		logic: { definition, ctor: Logic },
	};
}

export type ParticleEmitterBlockLogic = typeof ParticleEmitter.Logic;
export const ParticleBlocks: readonly BlockBuilder[] = [ParticleCreator.Block, ParticleEmitter.Block];
