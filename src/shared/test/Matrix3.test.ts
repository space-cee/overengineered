import { Assert } from "engine/shared/Assert";
import { JSON } from "engine/shared/fixes/Json";
import { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

export namespace Tests.Matrix3Tests {
	export function configRoundTrip() {
		const value: BlockLogicTypes.Matrix3Value = {
			row1: new Vector3(1, 2, 3),
			row2: new Vector3(4, 5, 6),
			row3: new Vector3(7, 8, 9),
		};
		const restored = JSON.deserialize<{ type: "matrix3"; config: BlockLogicTypes.Matrix3Value }>(
			JSON.serialize({ type: "matrix3", config: value }),
		);

		Assert.equals(restored.type, "matrix3");
		Assert.isTrue(BlockLogicTypes.T.primitives.matrix3!.func(restored.config));
		Assert.equals(restored.config.row1, value.row1);
		Assert.equals(restored.config.row2, value.row2);
		Assert.equals(restored.config.row3, value.row3);
		Assert.isFalse(BlockLogicTypes.T.primitives.matrix3!.func({ ...restored.config, row3: 5 }));
	}
}
