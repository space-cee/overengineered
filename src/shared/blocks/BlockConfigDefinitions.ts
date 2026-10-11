import type { BlockLogicFullInputDef } from "shared/blockLogic/BlockLogic";

export const BlockConfigDefinitions = {
	any: {
		bool: { config: false as boolean },
		number: { config: 0 as number },
		vector3: { config: Vector3.zero },
		matrix3: { config: { row1: Vector3.xAxis, row2: Vector3.yAxis, row3: Vector3.zAxis } },
		string: { config: "" as string },
		byte: { config: 0 as number },
		color: { config: new Color3(0, 0, 0) },
		sound: { config: { id: "" as string } },
	},
	number: {
		number: { config: 0 as number },
	},
	string: {
		string: { config: "" as string },
	},
	bool: {
		bool: { config: false as boolean },
	},
	byte: {
		byte: { config: 0 as number },
	},
	vector3: {
		vector3: { config: new Vector3(0, 0, 0) },
	},
	matrix3: {
		matrix3: { config: { row1: Vector3.xAxis, row2: Vector3.yAxis, row3: Vector3.zAxis } },
	},
	color: {
		color: { config: new Color3(0, 0, 0) },
	},
} as const satisfies { readonly [k in string]: BlockLogicFullInputDef["types"] };
