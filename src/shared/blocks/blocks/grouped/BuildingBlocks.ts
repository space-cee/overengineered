import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks: BlockBuildersWithoutIdAndDefaults = {
	block: {
		displayName: "Block",
		description: "Makes you question why every engineering game has it",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	truss: {
		displayName: "Truss",
		description: "Climbable and veeeery cool.",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	trussunsupported: {
		displayName: "Unsupported truss",
		description: "Climbable, but less cool than the ~normal~ one",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	scalabletruss1: {
		displayName: "Scalable truss 1",
		description: "Maybe climbable, possible cool, actually scalable. Empty variant",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	scalabletruss2: {
		displayName: "Scalable truss 2",
		description: "Maybe climbable, possible cool, actually scalable. Somewhat empty variant",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	scalabletruss3: {
		displayName: "Scalable truss 3",
		description: "Maybe climbable, possible cool, actually scalable. Kinda empty variant",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	halfblock: {
		displayName: "Half Block",
		description: "Like a block, but with a small caveat...",
	},

	angledmirror: {
		displayName: "Angled Mirror",
		description: "A mirror for lasers, but its a triangle.",
		search: { partialAliases: ["laser", "wedge"] },
	},
	mirror: {
		displayName: "Mirror Pane",
		description: "A flat mirror. It disapproves of lasers by reflecting them.",
		search: { partialAliases: ["laser", "plate"] },
	},
	invertedblock: {
		displayName: "Inverted Block",
		description: "ti sah emag gnireenigne yreve yhw noitseuq uoy sekaM",

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	blockconcavity: {
		displayName: "Block Concavity",
		description: "Block shot in the bronx",
	},

	blockconcavitybeveled: {
		displayName: "Block Concavity Beveled",
		description: "They have not healed...",
	},
};

const balls: BlockBuildersWithoutIdAndDefaults = {
	ball: {
		displayName: "Ball",
		description: "it could be a cannon ball.. Or anything else, really..",
		search: { partialAliases: ["circle", "sphere"] },
	},
	hollowball: {
		displayName: "Hollow Ball",
		description: "Is it useful? No idea!",
		search: { partialAliases: ["circle", "sphere"] },
	},

	halfball: {
		displayName: "Half Ball",
		description: "It's rolling around.. half of the time..",
		search: { partialAliases: ["circle", "sphere"] },
	},
	hollowhalfball: {
		displayName: "Hollow Half Ball",
		description: "The MOON is made of CHEESE and THIS is made of HOPES and DREAMS.",
		search: { partialAliases: ["circle", "sphere"] },
	},

	quarterball: {
		displayName: "Quarter Ball",
		description: "It's like a huge melon slice..",
		search: { partialAliases: ["circle", "sphere"] },
	},
	hollowquarterball: {
		displayName: "Hollow Quarter Ball",
		description: "Sorry, I was hungry. I ate the insides.",
		search: { partialAliases: ["circle", "sphere"] },
	},

	ball8: {
		displayName: "1/8 Ball",
		description: "Did you ever hear of number's diet? I once saw 1/8 ball.",
		search: { partialAliases: ["circle", "sphere"] },
		mirror: { behaviour: "tetra" },
	},
	hollowball8: {
		displayName: "Hollow 1/8 Ball",
		description:
			"I feel like there a way to make a joke about the name, but I can't really figure it out like with the non-hollow version..",
		search: { partialAliases: ["circle", "sphere"] },
		mirror: { behaviour: "tetra" },
	},
	invertedball: {
		displayName: "Inverted Ball",
		description: "Snow Globe",
		search: { partialAliases: ["circle", "sphere"] },
	},

	halfballhole: {
		displayName: "Half Ball Hole",
		description: "It's rolling around.. half of the time.. with a hole...",
		search: { partialAliases: ["circle", "sphere"] },
	},

	hollowhalfballhole: {
		displayName: "Hollow Half Ball Hole",
		description: "Half ball but even more empty",
		search: { partialAliases: ["circle", "sphere"] },
	},

	hollowhalfballflat: {
		displayName: "Hollow Half Ball Flat",
		description: "Hollow Half ball but flat",
		search: { partialAliases: ["circle", "sphere"] },
	},

	halfballflat: {
		displayName: "Half Ball Flat",
		description: "Half ball but faded",
		search: { partialAliases: ["circle", "sphere"] },
	},

	head: {
		displayName: "Head",
		description: "Who's is it?",
		search: { partialAliases: ["body", "sphere"] },
	},
};

const beams: BlockBuildersWithoutIdAndDefaults = {
	beam2x1: {
		displayName: "Beam 2x1",
		description: "A block, but 2x1!",
	},
	beam3x1: {
		displayName: "Beam 3x1",
		description: "A block, but 3x1!!",
	},
	beam4x1: {
		displayName: "Beam 4x1",
		description: "A block, but 4x1!!!",
	},
};

const cornerWedges: BlockBuildersWithoutIdAndDefaults = {
	concavecornerwedge: {
		displayName: "Concave Corner Wedge",
		description: "The convex corner wedge, but concave",

		mirror: { behaviour: "cornerwedge" },
	},
	convexcornerwedge: {
		displayName: "Convex Corner Wedge",
		description: "The concave corner wedge, but convex",

		mirror: { behaviour: "cornerwedge" },
	},
	cornerwedge1x1: {
		displayName: "Corner Wedge 1x1",
		description: "A simple corner wedge",

		mirror: { behaviour: "cornerwedge" },
	},
	cornerwedge2x1: {
		displayName: "Corner Wedge 2x1",
		description: "A simple corner weedge",

		mirror: { behaviour: "cornerwedge" },
	},
	cornerwedge3x1: {
		displayName: "Corner Wedge 3x1",
		description: "A simple corner weeedge",

		mirror: { behaviour: "cornerwedge" },
	},
	cornerwedge4x1: {
		displayName: "Corner Wedge 4x1",
		description: "A simple corner weeeedge",

		mirror: { behaviour: "cornerwedge" },
	},
	innercorner: {
		displayName: "Inner Corner",
		description: "An inner corner. Some long time ago it was called an Inner Wedge.. Good times!",

		mirror: { behaviour: "offset270" },
	},
	innertetra: {
		displayName: "Inner Tetra 1x1",
		description: "This name was chosen just to make the searching more inconvenient",

		mirror: { behaviour: "innertetra" },
	},
	innertetra2x1: {
		displayName: "Inner Tetra 2x1",
		description: "This name was chosen just to make the searching 2 times inconvenient",

		mirror: { behaviour: "innertetra" },
	},
	innertetra3x1: {
		displayName: "Inner Tetra 3x1",
		description: "This name was chosen just to make the searching 3 times inconvenient",

		mirror: { behaviour: "innertetra" },
	},
	innertetra4x1: {
		displayName: "Inner Tetra 4x1",
		description: "This name was chosen just to make the searching 4 times inconvenient",

		mirror: { behaviour: "innertetra" },
	},
	tetrahedron: {
		displayName: "Tetrahedron 1x1",
		description: "The simplest polyhedron, the faces of which are four triangles",
		mirror: { behaviour: "tetra" },
	},
	tetrahedron2x1: {
		displayName: "Tetrahedron 2x1",
		description: "The simplest polyhedron, whose faces are four triangles, but slightly longer",
		mirror: { behaviour: "tetra" },
	},
	tetrahedron3x1: {
		displayName: "Tetrahedron 3x1",
		description: "The simplest polyhedron, whose faces are four triangles, but much longer",
		mirror: { behaviour: "tetra" },
	},
	tetrahedron4x1: {
		displayName: "Tetrahedron 4x1",
		description: "The simplest polyhedron, whose faces are four triangles, but unfathomably longer",
		mirror: { behaviour: "tetra" },
	},
	tetraround: {
		displayName: "Tetra Round",
		description: "A rounded version of the tetrahedron",

		mirror: { behaviour: "cornerwedge" },
	},
	halfcornerwedge1x1: {
		displayName: "Half Corner Wedge 1x1",
		description: "A corner wedge 1x1, but it's.. half.. the size?",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge1x1mirrored" },
	},
	halfcornerwedge2x1: {
		displayName: "Half Corner Wedge 2x1",
		description: "A corner wedge 2x1, but it's.. half.. the size?",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge2x1mirrored" },
	},
	halfcornerwedge3x1: {
		displayName: "Half Corner Wedge 3x1",
		description: "A corner wedge 3x1, but it's.. half.. the size?",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge3x1mirrored" },
	},
	halfcornerwedge4x1: {
		displayName: "Half Corner Wedge 4x1",
		description: "It stopped making any sense..",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge4x1mirrored" },
	},
	halfcornerwedge1x1mirrored: {
		displayName: "Half Corner Wedge 1x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge1x1" },
	},
	halfcornerwedge2x1mirrored: {
		displayName: "Half Corner Wedge 2x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge2x1" },
	},
	halfcornerwedge3x1mirrored: {
		displayName: "Half Corner Wedge 3x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge3x1" },
	},
	halfcornerwedge4x1mirrored: {
		displayName: "Half Corner Wedge 4x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "normal", replacementId: "halfcornerwedge4x1" },
	},
	quartercornercornerwedge1x1: {
		displayName: "Quarter Corner Corner Wedge 1x1",
		description: "Corny Corner Wedge, hehe",

		mirror: { behaviour: "cornerwedge" },
	},

	quartercornercornerwedge1x1mirrored: {
		displayName: "Quarter Corner Corner Wedge 1x1 Mirrored",
		description: "Corny Corner Wedge, but Mirrored, hehe",

		mirror: { behaviour: "cornerwedge" },
	},
};

const cones: BlockBuildersWithoutIdAndDefaults = {
	cone: {
		displayName: "Cone",
		description: "Filled with weird geometry jokes. Sadly, no ice cream",
	},
	conehalf: {
		displayName: "Cone Half",
		description: "Half of a cone, surprisingly",
	},
	conequarter: {
		displayName: "Cone Quarter",
		description: "What do you evene expect from thsi",
	},
	offsetcone: {
		displayName: "Offset Cone",
		description: "Melted Cone",
	},
	coneparabolic: {
		displayName: "Cone (Parabolic)",
		description: "rocket cone",
	},
	hollowconeparabolic: {
		displayName: "Hollow Cone (Parabolic)",
		description: "hollow rocket cone",
	},
	halfcone: {
		displayName: "Half Cone",
		description: "Not to be confused with cone half",
	},
	cutcone: {
		displayName: "Cut Cone",
		description: "Filled with weird geome",
	},
	halfcutcone: {
		displayName: "Half Cut Cone",
		description: "Half Filled with weird geome",
	},
	hollowcone: {
		displayName: "Hollow Cone",
		description: "Finally, ice cream jokes are on the menu",
	},
	hollowconehalf: {
		displayName: "Hollow Cone Half",
		description: "Half of something useful",
	},
	hollowconequarter: {
		displayName: "Hollow Cone Quarter",
		description: "Quarter of something useful",
		mirror: { behaviour: "cornerwedge" },
	},
	convexcutcylinder: {
		displayName: "Convex Cut Cylinder",
		description: "Dome.",
		search: { partialAliases: ["dome"] },
	},

	hollowhalfcone: {
		displayName: "Hollow Half Cone",
		description: "Still vertically challenged. Now hollow. Looks suspiciously wearable.",
	},

	angledcutcone: {
		displayName: "Angled Cut Cone",
		description: "The cone did not sit still",
	},

	hollowcutcone: {
		displayName: "Hollow Cut Cone",
		description: "It's about time",
	},
	halfhollowcutcone: {
		displayName: "Half Hollow Cut Cone",
		description: "It's about half time",
	},

	quarterhollowcutcone: {
		displayName: "Quarter Hollow Cut Cone",
		description: "It's about quarter time",

		mirror: { behaviour: "cornerwedge" },
	},

	hollowangledcutcone: {
		displayName: "Hollow Angled Cut Cone",
		description: "Cut, hollow, angled. Yes, all of them",
	},
	hollowbezel: {
		displayName: "Hollow Bezel",
		description: "most cut hollow cone of them all",
		search: { partialAliases: ["cut cone", "hollow cut cone"] },
	},
	bezel: {
		displayName: "Bezel",
		description: "most cut cone of them all",
		search: { partialAliases: ["cut cone"] },
	},
	hollowthickbezel: {
		displayName: "Hollow Thick Bezel",
		description: "second most cut hollow cone of them all",
		search: { partialAliases: ["cut cone", "hollow cut cone"] },
	},
	thickbezel: {
		displayName: "Thick Bezel",
		description: "second most cut cone of them all",
		search: { partialAliases: ["cut cone"] },
	},
};

const cylinders: BlockBuildersWithoutIdAndDefaults = {
	cylinder1x1: {
		displayName: "Cylinder 1x1",
		description: "A simple cylinder",
	},
	cylinder1x2: {
		displayName: "Cylinder 1x2",
		description: "A not-so-simple cylinder",
	},
	cylinder2x1: {
		displayName: "Cylinder 2x1",
		description: "A wider sibling of 1x1 cylinder",
	},
	cylinder2x2: {
		displayName: "Cylinder 2x2",
		description: "A bigger sibling of 2x1 cylinder",
	},
	halfcylinder1x1: {
		displayName: "Half Cylinder 1x1",
		description: "A half of a sibling of 1x1 cylinder",
	},
	halfcylinder1x2: {
		displayName: "Half Cylinder 1x2",
		description: "A bigger half of a sibling of 1x1 cylinder",
	},
	halfcylinder2x1: {
		displayName: "Half Cylinder 2x1",
		description: "Same as 1x2 half cylinder but wider",
	},
	halfcylinder2x2: {
		displayName: "Half Cylinder 2x2",
		description: "Same as 1x2 half cylinder but wider and longer",
	},
	quartercylinder: {
		displayName: "Quarter Cylinder",
		description: "Like a cylinder but cilynder",
		mirror: { behaviour: "hcylquart" },
	},

	hollowcylinder: {
		displayName: "Hollow Cylinder",
		description: "A complicated cylinder",
		search: { partialAliases: ["tube", "pipe"] },
	},
	hollowcylinderhalf: {
		displayName: "Hollow Cylinder Half",
		description: "Almost a complicated cylinder",
		search: { partialAliases: ["tube", "pipe"] },
	},
	hollowcylinderquarter: {
		displayName: "Hollow Cylinder Quarter",
		description: "Not really a complicated cylinder",
		mirror: { behaviour: "hcylquart" },
		search: { partialAliases: ["tube", "pipe"] },
	},
	hollowcylinder90: {
		displayName: "Hollow Cylinder (90 degrees)",
		description: "A bended hollow tube for all your sewer needs",
		search: { partialAliases: ["tube", "pipe"] },
	},
	cylinder90: {
		displayName: "Cylinder (90 degrees)",
		description: "A bended tube NOT for all your sewer needs",
		search: { partialAliases: ["tube", "pipe"] },
	},
	hollowcylinder90verticalhalf: {
		displayName: "Vertical Half Hollow Cylinder (90 degrees)",
		description: "A vertical half of a bended hollow tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},
	cylinder90verticalhalf: {
		displayName: "Vertical Half Cylinder (90 degrees)",
		description: "A vertical half of a bended tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},
	hollowcylinder90horizontalhalf: {
		displayName: "Horizontal Half Hollow Cylinder (90 degrees)",
		description: "A horizontal half of a bended hollow tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},
	cylinder90horizontalhalf: {
		displayName: "Horizontal Half Cylinder (90 degrees)",
		description: "A horizontal half of a bended tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},

	hollowcylinderbig90: {
		displayName: "Big Hollow Cylinder (90 degrees)",
		description: "A beeg bended hollow tube for all your sewer needs",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
	},
	cylinderbig90: {
		displayName: "Big Cylinder (90 degrees)",
		description: "A beeg bended tube NOT for all your sewer needs",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
	},
	hollowcylinderbig90verticalhalf: {
		displayName: "Vertical Half Big Hollow Cylinder (90 degrees)",
		description: "A big vertical half of a bended hollow tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},
	cylinderbig90verticalhalf: {
		displayName: "Vertical Half Big Cylinder (90 degrees)",
		description: "A big vertical half of a bended tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},
	hollowcylinderbig90horizontalhalf: {
		displayName: "Horizontal Half Big Hollow Cylinder (90 degrees)",
		description: "A big horizontal half of a bended hollow tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},
	cylinderbig90horizontalhalf: {
		displayName: "Horizontal Half Big Cylinder (90 degrees)",
		description: "A big horizontal half of a bended tube",
		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},

	cylinderto1x1cubeconnector: {
		displayName: "Cylinder To 1x1 Cube Connector",
		description: "A connector to connect your connections between cylinder connection and cube connection",
	},
	cylinderto2x1cubeconnector: {
		displayName: "Cylinder To 2x1 Cube Connector",
		description: "A connector to connect your connections between cylinder connection and cube connection but wide",
	},
	cylinderto2x2cubeconnector: {
		displayName: "Cylinder To 2x2 Cube Connector",
		description: "A connector to connect your connections between cylinder connection and cube connection but big",
	},
	cylinderto2x4cubeconnector: {
		displayName: "Cylinder To 2x4 Cube Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but increased in size",
	},
	halfcylinderto1x1cubeconnector: {
		displayName: "Half Cylinder To 1x1 Cube Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but some sizes were halved",
	},
	halfcylinderto1xhalfcubeconnector: {
		displayName: "Half Cylinder To 1xHalf Cube Connector",
		description: "A connector to connect your connections but I'm getting tired of making the descriptions",
	},
	halfcylinderto2x2cubeconnector: {
		displayName: "Half Cylinder To 2x2 Cube Connector",
		description: "A connector to connect things",
	},
	halfcylinderto2x1cubeconnector: {
		displayName: "Half Cylinder To 2x1 Cube Connector",
		description: "A connector but wife left me",
	},

	cylinderto2x2cubehollowconnector: {
		displayName: "Cylinder To 2x2 Cube Hollow Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but big and hollow",
	},
	cylinderto2x4cubehollowconnector: {
		displayName: "Cylinder To 2x4 Cube Hollow Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but increased in size but hollow",
	},
	halfcylinderto2x2cubehollowconnector: {
		displayName: "Half Cylinder To 2x2 Cube Hollow Connector",
		description: "A connector to connect things but hollow",
	},
	halfcylinderto2x1cubehollowconnector: {
		displayName: "Half Cylinder To 2x1 Cube Hollow Connector",
		description: "A connector but wife left me but hollow",
	},

	cylinderto1x1cubehollowconnector: {
		displayName: "Cylinder To 1x1 Cube Hollow Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but hollow",
	},
	cylinderto2x1cubehollowconnector: {
		displayName: "Cylinder To 2x1 Cube Hollow Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but wide but hollow",
	},
	halfcylinderto1x1cubehollowconnector: {
		displayName: "Half Cylinder To 1x1 Cube Hollow Connector",
		description:
			"A connector to connect your connections between cylinder connection and cube connection but some sizes were halved but hollow",
	},
	halfcylinderto1xhalfcubehollowconnector: {
		displayName: "Half Cylinder To 1xHalf Cube Hollow Connector",
		description:
			"A connector to connect your connections but I'm getting tired of making the descriptions but hollow",
	},
	invertedcylinder: {
		displayName: "Inverted Cylinder",
		description: "Will this ever get used? Prob, Will it ever be useful? no.",
	},

	concavecylinder: {
		displayName: "Concave Cylinder",
		description: "Curvy just how i like it.",
	},

	hollowcylinder1hole: {
		displayName: "Hollow Cylinder 1 Hole",
		description: "A simple hollow cylinder 1 hole",
	},

	halfhollowcylinder1hole: {
		displayName: "Half Hollow Cylinder 1 Hole",
		description: "A simple half hollow cylinder 1 hole",
	},

	quarterhollowcylinder1hole: {
		displayName: "Quarter Hollow Cylinder 1 Hole",
		description: "A simple quarter hollow cylinder 1 hole",

		mirror: { behaviour: "hcylquart" },
	},

	hollowcylinder2holes: {
		displayName: "Hollow Cylinder 2 Holes",
		description: "A simple hollow cylinder 2 holes",
	},

	hollowcylinder4holes: {
		displayName: "Hollow Cylinder 4 Holes",
		description: "A simple hollow cylinder 4 holes",
	},

	cylinderholeplug: {
		displayName: "Hollow cylinder hole plug",
		description: "Pluh",
	},

	truncatedcylinder1x2: {
		displayName: "Truncated Cylinder 1x2",
		description: "A cylinder that went through a phase",
		search: { partialAliases: ["cut cylinder"] },
	},

	truncatedcylinder1x1: {
		displayName: "Truncated Cylinder 1x1",
		description: "A cylinder halfway through a phase",
		search: { partialAliases: ["cut cylinder"] },
	},

	hollowtruncatedcylinder1x1: {
		displayName: "Thick Hollow Truncated Cylinder 1x1",
		description: "A cylinder that went through a phase and came back empty",
		search: { partialAliases: ["cut cylinder"] },
	},

	thinhollowtruncatedcylinder1x1: {
		displayName: "Hollow Truncated Cylinder 1x1",
		description: "A cylinder that went through a phase and came back emptier",
		search: { partialAliases: ["cut cylinder"] },
	},

	thickhollowcylinder: {
		displayName: "Thick Hollow Cylinder",
		description: "A complicated cylinder but american",
		search: { partialAliases: ["tube", "pipe"] },
	},

	thickhollowcylinderhalf: {
		displayName: "Thick Hollow Cylinder Half",
		description: "Almost a complicated cylinder but american",
		search: { partialAliases: ["tube", "pipe"] },
	},

	thickhollowcylinderquarter: {
		displayName: "Thick Hollow Cylinder Quarter",
		description: "Not really a complicated cylinder but american",

		mirror: { behaviour: "hcylquart" },
		search: { partialAliases: ["tube", "pipe"] },
	},

	hollowcylinderbig90quarter: {
		displayName: "Quarter Big Hollow Cylinder (90 degrees)",
		description: "A big quarter of a bended hollow tube",

		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},

	cylinderbig90quarter: {
		displayName: "Quarter Big Cylinder (90 degrees)",
		description: "A big quarter of a bended tube",

		search: { partialAliases: ["tube", "pipe", "macaroni"] },
		mirror: { behaviour: "hcylvertical" },
	},

	crosstee: {
		displayName: "Cross Tee",
		description: "4 way pipe connection",

		search: { partialAliases: ["tube", "pipe", "4 way", "fitting"] },
	},

	tee: {
		displayName: "Tee",
		description: "3 way pipe connection",

		search: { partialAliases: ["tube", "pipe", "3 way", "fitting"] },
	},

	torus: {
		displayName: "Torus",
		description: "But why",

		search: { partialAliases: ["donut"] },
	},

	hollowtorus: {
		displayName: "Hollow Torus",
		description: "dobenut",

		search: { partialAliases: ["donut"] },
	},
};

const wedges: BlockBuildersWithoutIdAndDefaults = {
	concaveprism: {
		displayName: "Concave Prism",
		description: "The convex prism, but concave",

		mirror: { behaviour: "offset180" },
	},
	convexprism: {
		displayName: "Convex Prism",
		description: "The concave prism, but convex",

		mirror: { behaviour: "offset180" },
	},
	concaveprismoutercorner: {
		displayName: "Concave Prism Outer Corner",
		description: "The convex prism outer corner, but concave",

		mirror: { behaviour: "cornerwedge" },
	},
	concaveprisminnercorner: {
		displayName: "Concave Prism Inner Corner",
		description: "The convex prism inner con- wait we don't have that block",

		mirror: { behaviour: "cornerwedge" },
	},
	convexprismoutercorner: {
		displayName: "Convex Prism Outer Corner",
		description: "The concave prism outer corner, but convex",

		mirror: { behaviour: "cornerwedge" },
	},
	circularcornerwedge: {
		displayName: "Circular Corner Wedge",
		description: "what",

		mirror: { behaviour: "offset180", replacementId: "circularcornerwedgemirrored" },
	},
	circularcornerwedgemirrored: {
		displayName: "Circular Corner Wedge (Mirrored)",
		description: "what",

		mirror: { behaviour: "offset180", replacementId: "circularcornerwedge" },
	},
	pyramid: {
		displayName: "Pyramid",
		description: "triangel",
	},
	wedge1x1: {
		displayName: "Wedge 1x1",
		description: "A simple wedge",
	},
	wedge1x2: {
		displayName: "Wedge 1x2",
		description: "A longer wedge",
	},
	wedge1x3: {
		displayName: "Wedge 1x3",
		description: "A longer longer wedge",
	},
	wedge1x4: {
		displayName: "Wedge 1x4",
		description: "A loooonger wedge",
	},
	halfwedge1x1: {
		displayName: "Half Wedge 1x1",
		description: "A wedge 1x1, but it's.. half.. the size?",
	},
	halfwedge1x2: {
		displayName: "Half Wedge 1x2",
		description: "A wedge 1x2, but it's.. half.. the size?",
	},
	halfwedge1x3: {
		displayName: "Half Wedge 1x3",
		description: "A wedge 1x3, but it's.. half.. the size?",
	},
	halfwedge1x4: {
		displayName: "Half Wedge 1x4",
		description: "A wedge 1x4, but it's.. half.. the size?",
	},
	cutpyramid: {
		displayName: "Cut Pyramid",
		description: "Cut triangel",
	},

	cutpyramidhalf: {
		displayName: "Cut Pyramid Half",
		description: "Half Cut triangel",
	},

	cutpyramidquarter: {
		displayName: "Cut Pyramid Quarter",
		description: "Quarter Cut triangel",

		mirror: { behaviour: "cornerwedge" },
	},

	shortercutpyramid: {
		displayName: "Shorter Cut Pyramid",
		description: "A triangel that was cut, then cut again",
	},

	shortestcutpyramid: {
		displayName: "Shortest Cut Pyramid",
		description: "A triangel that was cut, then cut again, then cut again",
	},

	tile: {
		displayName: "tile",
		description: "actually just a triangel that was cut a FOURTH time",
	},

	hollowwedge1: {
		//UnderEngineered
		displayName: "Hollow Wedge 1/2",
		description: "I eated half of it",
	},

	hollowwedge2: {
		//UnderEngineered
		displayName: "Hollow Wedge 1/4",
		description: "I eated 3/4 of it",
	},

	hollowwedge3: {
		//UnderEngineered
		displayName: "Hollow Wedge 1/8",
		description: "I eated 7/8ths of it",
	},

	wedgeface1x1: {
		displayName: "Wedge face 1x1",
		description: "A simple wedge face",
	},
};

const trainWheels: BlockBuildersWithoutIdAndDefaults = {
	largeoldtrainwheel: {
		displayName: "Large Old Train Wheel",
		description: "A large old train wheel",
	},
	smallnewtrainwheel: {
		displayName: "Small Modern Train Wheel",
		description: "A modern small train wheel",
	},
	smalloldtrainwheel: {
		displayName: "Small Old Train Wheel",
		description: "A small cousin of the old train wheel",
	},
};

const random: BlockBuildersWithoutIdAndDefaults = {
	swirly: {
		displayName: "Swirly",
		description: "Can thy self bring me a cuppah tea?",
	},

	swirlylilside: {
		displayName: "Swirly Lil Side",
		description: "Good for your hooks, or not",
	},

	swirlybigside: {
		displayName: "Swirly Big Side",
		description: "This should be called Curly",
	},

	spring: {
		displayName: "Spring",
		description: "We have stolen the sus out of suspension",
	},

	bolthead: {
		displayName: "Bolt head",
		description: "Why? No idea, but you have it so be happy. or else. PS great for smoothing, somehow",
	},

	maxwell: {
		displayName: "Maxwell",
		description: "No Idea what this does, it made my game laggier",
	},

	makster: {
		displayName: "Makster",
		description: "The most powerful",
		devOnly: true,
	},

	buildinglight: {
		displayName: "Building Light",
		description: "Let there be light",
	},

	spaceshipblock: {
		displayName: "Greeble Block",
		description: "Metal Block with a custom spaceship metal material. thats all",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	spaceshipblock2: {
		displayName: "Small Greeble Block",
		description: "Metal Block with a different custom spaceship metal material. thats all",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	chromeblock: {
		displayName: "Chrome Block",
		description: "FUTUREEEEEE PS: looks bad in lite version",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
};
//

const list: BlockBuildersWithoutIdAndDefaults = {
	...blocks,
	...balls,
	...beams,
	...cornerWedges,
	...cones,
	...cylinders,
	...wedges,
	...trainWheels,
	...random,
};
export const BuildingBlocks = BlockCreation.arrayFromObject(list);
