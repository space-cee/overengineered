import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks: BlockBuildersWithoutIdAndDefaults = {
	anchorblock: {
		displayName: "Anchor",
		description: "An immovable block",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	ballinsocket: {
		displayName: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
	},

	ballinsocketangled: {
		displayName: "Ball in Socket (Angled)",
		description: "Angled ball socket for your mechanical ingenuities",
	},

	shaft: {
		displayName: "Shaft",
		description: "A long thin pipe",
	},

	driveshaft: {
		displayName: "Driveshaft",
		description: "Kinda like a ball socket but with transmitting rotational force",

		search: {
			partialAliases: ["universal", "joint"],
		},
	},

	smallgear: {
		displayName: "Small Gear (Legacy)",
		description: "A cog for your machinery. Better use Spur Gear.",
	},

	spurgear: {
		displayName: "Spur Gear",
		description: "Just a regular gear",
	},

	bevelgear: {
		displayName: "Beveled Gear",
		description: "Tilted Spur Gear",
	},

	txmbevelfilled: {
		displayName: "TXM Bevel Gear (Filled)",
		description: "TETRIX MAX Bevel Gear",
	},

	helicalgear: {
		displayName: "Helical Gear",
		description: "Tilted Beveled Gear",
	},

	wormgear: {
		displayName: "Worm Gear",
		description: "A screw-shaped gear used for large reductions in speed. (unstable)",

		search: {
			partialAliases: ["worm", "gear", "worm drive"],
		},
	},

	wormgearmirrored: {
		displayName: "Worm Gear Mirrored",
		description: "worm gear but mirror",
	},

	// new stuffs

	wormgear2: {
		displayName: "Worm Gear 2",
		description: "A screw-shaped gear used for large reductions in speed but ver 2. (unstable)",

		search: {
			partialAliases: ["worm", "gear", "worm drive"],
		},
	},

	wormwheel: {
		displayName: "Worm Wheel",
		description: "Pair with Worm Gear 2",
	},

	//

	gearrack: {
		displayName: "Rack (Gear)",
		description: "It's like a flat gear.. I mean gears are already flat but this one is a different way",
	},

	sprocketgear: {
		displayName: "Sprocket",
		description: "Use it to hold your tank tracks",

		search: {
			partialAliases: ["gear", "sprocket", "track"],
		},
	},

	cadgear12: {
		displayName: "12 tooth gear",
		description: "Just a regular gear, Cog, Whatever",
	},

	cadgear18: {
		displayName: "18 tooth gear",
		description: "Gear for idk, random clocks or car enginez",
	},

	cadgear24: {
		displayName: "24 tooth gear",
		description: "Haha, Only 24 teeth",
	},

	cadgear36: {
		displayName: "36 tooth gear",
		description: "Where did those 4 extra teeth come from?",
	},

	cadgear48: {
		displayName: "48 tooth gear",
		description: "The SUN",
	},

	txm120tooth: {
		displayName: "TXM 120 tooth gear",
		description: "TETRIX MAX 120 tooth gear",
	},

	txm40tooth: {
		displayName: "TXM 40 tooth gear",
		description: "TETRIX MAX 40 tooth gear",
	},

	helical12: {
		displayName: "Right Helical Gear 12 tooth",
		description: "twisted gear",
	},

	mhelical12: {
		displayName: "Left Helical Gear 12 tooth",
		description: "twisted gear",
	},

	herringbone: {
		displayName: "Herringbone gear 12 tooth",
		description: "double twisted gear",
	},

	mherringbone: {
		displayName: "Mirroed Herringbone gear 12 tooth",
		description: "double twisted gear",
	},
	tanksprocket1: {
		displayName: "Tank Sprocket 1",
		description: "Spiky tank sprocket",
		search: {
			partialAliases: ["sprocket", "running gear", "tracks"],
		},
	},
	wingrounding: {
		displayName: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},

	wingsharpening: {
		displayName: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
};

export const MechanicalBlocks = BlockCreation.arrayFromObject(blocks);
