import { Colors } from "engine/shared/Colors";
import { Element } from "engine/shared/Element";
import { Instances } from "engine/shared/fixes/Instances";
import { Objects } from "engine/shared/fixes/Objects";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["assetid", "stretch", "transparency", "studsPerTileU", "studsPerTileV", "color", "singleFace"],
	input: {
		assetid: {
			displayName: "Texture ID",
			types: {
				string: { config: "8508980527" },
				number: { config: 8508980527 },
			},
		},
		stretch: {
			displayName: "Stretch",
			types: { bool: { config: true } },
		},
		transparency: {
			displayName: "Transparency",
			types: { number: { config: 0, clamp: { showAsSlider: true, min: 0, max: 1 } } },
		},
		studsPerTileU: {
			displayName: "Studs Per Tile Width",
			types: { number: { config: 2, clamp: { showAsSlider: true, min: 1, max: 100 } } },
		},
		studsPerTileV: {
			displayName: "Studs Per Tile Height",
			types: { number: { config: 2, clamp: { showAsSlider: true, min: 1, max: 100 } } },
		},
		color: {
			displayName: "Color",
			types: { color: { config: Colors.white } },
		},
		singleFace: {
			displayName: "Single face",
			types: { bool: { config: false } },
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

const updateType = t.intersection(
	t.interface({
		block: t.instance("Model").as<BlockModel>(),
		stretch: t.boolean,
	}),
	t.partial({
		assetId: t.union(t.string, t.number),
		transparency: t.numberWithBounds(0, 1),
		studsPerTileU: t.number,
		studsPerTileV: t.number,
		color: t.color,
		singleFace: t.boolean,
	}),
);
type updateType = t.Infer<typeof updateType>;

const update = ({
	block,
	stretch,
	assetId,
	transparency,
	studsPerTileU,
	studsPerTileV,
	color,
	singleFace,
}: updateType) => {
	const part = block.FindFirstChild("Part") as Part | undefined;
	if (!part) return;

	// Find first available child to extract fallback attributes from
	const firstChild = part
		.GetChildren()
		.find((child): child is Texture | Decal => child.IsA("Texture") || child.IsA("Decal"));

	// Fallback extraction
	let finalAssetId = assetId;
	if (finalAssetId === undefined && firstChild && firstChild.Texture !== "") {
		const extractedId = string.match(firstChild.Texture, "%d+")[0];
		if (extractedId !== undefined) {
			finalAssetId = extractedId;
		}
	}

	let finalTransparency = transparency;
	if (finalTransparency === undefined && firstChild) {
		finalTransparency = firstChild.Transparency;
	}

	let finalStudsPerTileU = studsPerTileU;
	if (finalStudsPerTileU === undefined && firstChild && firstChild.IsA("Texture")) {
		finalStudsPerTileU = firstChild.StudsPerTileU;
	}

	let finalStudsPerTileV = studsPerTileV;
	if (finalStudsPerTileV === undefined && firstChild && firstChild.IsA("Texture")) {
		finalStudsPerTileV = firstChild.StudsPerTileV;
	}

	let finalColor = color;
	if (finalColor === undefined && firstChild) {
		finalColor = firstChild.Color3;
	}

	for (const child of part.GetChildren()) {
		if (!child.IsA(stretch ? "Texture" : "Decal")) continue;
		child.Destroy();
	}

	let cur: readonly (Texture | Decal)[] = part
		.GetChildren()
		.filter((c): c is Texture | Decal => c.IsA(stretch ? "Decal" : "Texture"));
	if ((singleFace === true && cur.size() !== 1) || (singleFace === false && cur.size() !== 6)) {
		for (const item of cur) {
			item.Destroy();
		}
		cur = Objects.empty;
	}

	if (cur.size() === 0) {
		const forAllFaces = <T>(func: (face: Enum.NormalId) => T): T[] =>
			singleFace
				? [func(Enum.NormalId.Front)]
				: [
						func(Enum.NormalId.Top),
						func(Enum.NormalId.Bottom),
						func(Enum.NormalId.Left),
						func(Enum.NormalId.Right),
						func(Enum.NormalId.Front),
						func(Enum.NormalId.Back),
					];

		if (stretch) {
			cur = forAllFaces((face) => Element.create("Decal", { Name: face.Name, Face: face, Parent: part }));
		} else {
			cur = forAllFaces((face) => Element.create("Texture", { Name: face.Name, Face: face, Parent: part }));
		}
	}

	type TextureDecal = Texture & Decal;
	for (const child of cur) {
		if (finalAssetId !== undefined) {
			(child as TextureDecal).Texture = `rbxassetid://${finalAssetId}`;
		}
		if (finalTransparency !== undefined) {
			(child as TextureDecal).Transparency = finalTransparency;
		}
		if (!stretch) {
			if (finalStudsPerTileU !== undefined && child.IsA("Texture")) {
				child.StudsPerTileU = finalStudsPerTileU;
			}
			if (finalStudsPerTileV !== undefined && child.IsA("Texture")) {
				child.StudsPerTileV = finalStudsPerTileV;
			}
		}
		if (finalColor !== undefined) {
			(child as TextureDecal).Color3 = finalColor;
		}
	}
};

const events = {
	update: new BlockSynchronizer("tb_update", updateType, update),
};

export type { Logic as TextureBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const stretchCache = this.initializeInputCache("stretch");
		const assetIdCache = this.initializeInputCache("assetid");
		const transparencyCache = this.initializeInputCache("transparency");
		const studsPerTileUCache = this.initializeInputCache("studsPerTileU");
		const studsPerTileVCache = this.initializeInputCache("studsPerTileV");
		const colorCache = this.initializeInputCache("color");
		const singleFaceCache = this.initializeInputCache("singleFace");

		const sendFullUpdate = (overrides: Partial<updateType>) => {
			events.update.send({
				block: block.instance,
				stretch: stretchCache.get(),
				assetId: assetIdCache.get(),
				transparency: transparencyCache.get(),
				studsPerTileU: studsPerTileUCache.get(),
				studsPerTileV: studsPerTileVCache.get(),
				color: colorCache.get(),
				singleFace: singleFaceCache.get(),
				...overrides,
			});
		};

		this.onk(["stretch"], ({ stretch }) => sendFullUpdate({ stretch }));
		this.onk(["assetid"], ({ assetid }) => sendFullUpdate({ assetId: assetid }));
		this.onk(["transparency"], ({ transparency }) => sendFullUpdate({ transparency }));
		this.onk(["studsPerTileU"], ({ studsPerTileU }) => sendFullUpdate({ studsPerTileU }));
		this.onk(["studsPerTileV"], ({ studsPerTileV }) => sendFullUpdate({ studsPerTileV }));
		this.onk(["color"], ({ color }) => sendFullUpdate({ color }));
		this.onk(["singleFace"], ({ singleFace }) => sendFullUpdate({ singleFace }));
	}
}

const immediate = BlockCreation.immediate(definition, (block: BlockModel, config) => {
	Instances.waitForChild(block, "Part");

	events.update.send({
		block,
		stretch: BlockCreation.defaultIfWiredUnset(config?.stretch, definition.input.stretch.types.bool.config),
		assetId: BlockCreation.defaultIfWiredUnset(config?.assetid, definition.input.assetid.types.string.config),
		transparency: BlockCreation.defaultIfWiredUnset(
			config?.transparency,
			definition.input.transparency.types.number.config,
		),
		studsPerTileU: BlockCreation.defaultIfWiredUnset(
			config?.studsPerTileU,
			definition.input.studsPerTileU.types.number.config,
		),
		studsPerTileV: BlockCreation.defaultIfWiredUnset(
			config?.studsPerTileV,
			definition.input.studsPerTileV.types.number.config,
		),
		color: BlockCreation.defaultIfWiredUnset(config?.color, definition.input.color.types.color.config),
		singleFace: BlockCreation.defaultIfWiredUnset(
			config?.singleFace,
			definition.input.singleFace.types.bool.config,
		),
	});
});

export const TextureBlock = {
	...BlockCreation.defaults,
	id: "textureblock",
	displayName: "Texture Block",
	description: "Shows something appropriate",
	search: { partialAliases: ["decal", "image", "picture"] },

	logic: { definition, ctor: Logic, events, immediate },
} as const satisfies BlockBuilder;
