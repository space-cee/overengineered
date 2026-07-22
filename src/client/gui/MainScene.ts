import { SettingsPopup } from "client/gui/popup/SettingsPopup";
import { Scene } from "client/gui/Scene";
import { Action } from "engine/client/Action";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";

@injectable
export class MainScene extends Scene {
	readonly openSettingsAction: Action;

	constructor(@inject mainScreen: MainScreenLayout, @inject popupController: PopupController) {
		super();

		this.openSettingsAction = this.parent(new Action(() => popupController.showPopup(new SettingsPopup())));
		this.parent(mainScreen.top.main.addButton("Settings", { iconId: 11385220704 })) //
			.subscribeToAction(this.openSettingsAction)
			.subscribeVisibilityFrom({ main_enabled: this.enabledState });
	}
}
