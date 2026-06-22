import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsCamera extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("Camera");
		{
			this.addSlider("Field of View", { min: 1, max: 120, inputStep: 1 }) //
				.initToObjectPart(value, ["betterCamera", "fov"], "value");

			this.addSlider("Buildcam Speed", { min: 0.01, max: 2, inputStep: 0.01 })
				.initToObjectPart(value, ["betterCamera", "freecamSpeed"], "value")
				.setDescription("Build mode freecam speed multiplier");

			this.addToggle("Improved") //
				.initToObjectPart(value, ["betterCamera", "improved"]);

			this.addToggle("Strict Follow") //
				.initToObjectPart(value, ["betterCamera", "strictFollow"])
				.setDescription("Strictly follow the player");

			this.addToggle("Player Centered") //
				.initToObjectPart(value, ["betterCamera", "playerCentered"])
				.setDescription("Center camera at the player instead of the vehicle");
		}
	}
}
