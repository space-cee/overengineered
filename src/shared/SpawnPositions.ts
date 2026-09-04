type sps = readonly [name: string, { readonly name: string; readonly pos: CFrame | undefined }];

const cf = (x: number, y: number, z: number, yrot?: number) => {
	return new CFrame(x, y, z).ToWorldSpace(CFrame.fromOrientation(0, math.rad(yrot ?? 0), 0));
};

const sps = [
	["plot", { name: "Plot", pos: undefined }],
	["water1", { name: "Water 1", pos: cf(769, -16343.559, 1269.5) }],
	["water2", { name: "Water 2", pos: cf(1000, -16409.887, 3045) }],
	["water3", { name: "Water 3", pos: cf(-9943.9, -16381.5, -1347.3) }],
	["Abyss", { name: "Abyss", pos: cf(-10890.6, -17645.3, -1236.8) }],
	["space", { name: "Space", pos: cf(50, 26413, 894) }],
	["helipad", { name: "Helipad", pos: cf(901, -14869.997, -798) }],
	["helipad1", { name: "Helipad 1", pos: cf(296.5, -16380.999, -1138) }],
	["helipad2", { name: "Helipad 2", pos: cf(296.5, -16380.999, -1283) }],
	["helipad3", { name: "Helipad 3", pos: cf(296.5, -16380.999, -1428) }],
	["train1", { name: "Train tracks 1", pos: cf(441, -16379.27, 608) }],
	["train2", { name: "Train tracks 2", pos: cf(220.637, -16379.27, 1445.5, 90) }],
	["train3", { name: "Train tracks 3", pos: cf(2046.5, -16379.27, -665.596, 180) }],
	["train4", { name: "Train tracks 4", pos: cf(-1186.676, -16379.893, -347.449, 90) }],
	["idk", { name: "idk", pos: cf(-14101, -16409.887, 35045) }],
	["crusher", { name: "Crusher", pos: cf(775.5, -16346.143, -973.5) }],
	["stadium", { name: "Stadium?", pos: cf(2630.937, -16181.715, -32.289) }],
	["quarry", { name: "Quarry?", pos: cf(1410.5, -16358.775, -1399) }],
	["runway1", { name: "Runway 1", pos: cf(-95.001, -16380.999, -2000.25, 90) }],
	["runway2", { name: "Runway 2", pos: cf(-95.007, -16380.417, 1572.948, -90) }],
	["house", { name: "HOUSE", pos: cf(644.5, -16378.433, -2129.5) }],
	["mudbog", { name: "Mud Bog", pos: cf(-4340.5, -16371.57, -614.2) }],
	["icelake", { name: "Ice Lake", pos: cf(-4021.6, -16378.2, -2345.8) }],
	["sanddunes", { name: "Sand Dunes", pos: cf(-4322.4, -16358.2, 1760.2) }],
	["forest", { name: "Forest", pos: cf(-6105, -16373.1, -1988) }],
	["trenches", { name: "Trenches", pos: cf(-6321, -16390.1, -398.4) }],
	["derbyarena", { name: "Derby Arena", pos: cf(-2344.3, -16383.3, 5183.3) }],
	["catacombs", { name: "Catacombs", pos: cf(-8079.3, -16650, 5250.5) }],
	["superstructure", { name: "Super Structure", pos: cf(-14037.3, -15104.9, -8119.7) }],
	["jungleisland", { name: "Jungle Island", pos: cf(-6817, -16366, -10556) }],
	["moon", { name: "MOON", pos: cf(-8270, 66950.117, -1477.37) }],
	["underwater", { name: "Underwater", pos: cf(1250, -16493.559, 1750) }],
] as const satisfies readonly sps[];

export const spawnPositions: readonly sps[] = sps;
export const spawnPositionsKeyed = asObject(spawnPositions.mapToMap((c) => $tuple(c[0], c[1].pos)).asReadonly());

export type SpawnPosition = (typeof spawnPositions)[number][0];
