import { ConfigControlMulti } from "client/gui/configControls/ConfigControlMulti";
import { ConfigControlVector3 } from "client/gui/configControls/ConfigControlVector3";
import type { ConfigControlMultiDefinition } from "client/gui/configControls/ConfigControlMulti";
import type { ConfigControlVector3Definition } from "client/gui/configControls/ConfigControlVector3";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

export class ConfigControlMatrix3 extends ConfigControlMulti<BlockLogicTypes.Matrix3Value> {
	constructor(gui: ConfigControlMultiDefinition, vectorTemplate: ConfigControlVector3Definition, name: string) {
		super(gui, name);

		const addRow = (key: keyof BlockLogicTypes.Matrix3Value, label: string) => {
			const rowGui = vectorTemplate.Clone();
			rowGui.Visible = true;
			rowGui.Parent = gui.Content;
			const row = this.parent(new ConfigControlVector3(rowGui, label));
			this.valueChanged(() => row.setValues(this.multiMap((_, value) => value[key])));
			row.submitted((values) => this.submit(this.multiMap((uuid, value) => ({ ...value, [key]: values[uuid] }))));
		};

		addRow("row1", "Row 1");
		addRow("row2", "Row 2");
		addRow("row3", "Row 3");
	}
}
