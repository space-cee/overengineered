import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { Observables } from "engine/shared/event/Observables";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsInterface extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Interface");
		{
			this.addSlider("UI Scale", { min: 0.5, max: 2, inputStep: 0.01 }) //
				.initToObjectPart(value, ["uiScale"]);
		}

		this.addCategory("Wire/Weld tool");
		{
			this.addSlider("Marker transparency", { min: 0, max: 1 }) //
				.initToObjectPart(value, ["visuals", "wires", "markerTransparency"]);

			this.addSlider("Marker size multiplier", { min: 0.01, max: 4 }) //
				.initToObjectPart(value, ["visuals", "wires", "markerSizeMultiplier"]);

			this.addSlider("Wire transparency", { min: 0, max: 1 }) //
				.initToObjectPart(value, ["visuals", "wires", "wireTransparency"]);

			this.addSlider("Wire thickness multiplier", { min: 0.01, max: 4 }) //
				.initToObjectPart(value, ["visuals", "wires", "wireThicknessMultiplier"]);

			this.addToggle("Limit wires shown") //
				.initToObjectPart(value, ["visuals", "wires", "limitEnabled"]);

			const maxWiresSlider = this.addSlider("Max wires", { min: 10, max: 1000, inputStep: 1 }) //
				.initToObjectPart(value, ["visuals", "wires", "maxWires"]);

			maxWiresSlider.event.subscribeObservable(
				Observables.createObservableFromObjectProperty<boolean>(value, ["visuals", "wires", "limitEnabled"]),
				(enabled) => {
					maxWiresSlider.instance.Visible = enabled;
				},
				true,
			);
		}

		this.addCategory("Beacons") //
			.setTooltipText("On-screen position indicators");
		{
			this.addToggle("Players") //
				.initToObjectPart(value, ["beacons", "players"]);
			this.addToggle("Plot") //
				.initToObjectPart(value, ["beacons", "plot"]);
		}

		this.addToggle("Syntax highlight in code editor") //
			.initToObjectPart(value, ["syntaxHighlight"]);
	}
}
