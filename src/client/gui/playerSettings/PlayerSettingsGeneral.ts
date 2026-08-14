import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { PlayerConfigDefinition } from "shared/config/PlayerConfig";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsGeneral extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.addCategory("General");
		{
			this.addSlider("Music volume", PlayerConfigDefinition.music) //
				.initToObjectPart(value, ["music"], "value")
				.setDescription("Music while building and space-ing.");

			this.addToggle("Automatic slot loading") //
				.initToObjectPart(value, ["autoLoad"])
				.setDescription("Automatically load 'Last Exit' slot on join");

			this.addToggle("Automatic teleport to plot") //
				.initToObjectPart(value, ["autoPlotTeleport"])
				.setDescription("Automatically teleport to plot after despawning your vehicle");

			const saveToExternal = this.addToggle("Save to external") //
				.initToObjectPart(value, ["saveToExternal"])
				.setDescription("Save slots to the external database as well");

			this.addToggle("space-cee database") //
				.initToObjectPart(value, ["useSpaceCee"])
				.setDescription("Use the space-cee database for external save/load operations");

			this.event.subscribeObservable(
				value,
				(config) => {
					saveToExternal.setVisibleAndEnabled(config.useSpaceCee ?? false);
				},
				true,
			);

			this.addToggle("Public speakers") //
				.initToObjectPart(value, ["publicSpeakers"])
				.setDescription("Allow others to hear your speaker block and hear speakers of others");

			this.addToggle("Public particles") //
				.initToObjectPart(value, ["publicParticles"])
				.setDescription("Allow others to see your particles and see particles of others (Particle Block only)");

			this.addToggle("Beacon distance uses camera") //
				.initToObjectPart(value, ["beacons", "cameraOrigin"])
				.setDescription(
					"Use the camera location as the beacon reference origin instead of the local player root",
				);
		}
	}
}
