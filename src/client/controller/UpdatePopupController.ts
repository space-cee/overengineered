import { AlertPopup } from "client/gui/popup/AlertPopup";
import { HostedService } from "engine/shared/di/HostedService";
import type { PopupController } from "client/gui/PopupController";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class UpdatePopupController extends HostedService {
	constructor(@inject playerDataStorage: PlayerDataStorage, @inject popupController: PopupController) {
		super();

		this.onEnable(() => {
			const data = playerDataStorage.data.get();
			const lastJoin = data.data.lastJoin;

			playerDataStorage.sendPlayerDataValue("lastJoin", DateTime.now().UnixTimestamp);
			if (!lastJoin) return;

			if (lastJoin < DateTime.fromUniversalTime(2026, 7, 7, 8, 0).UnixTimestamp) {
				popupController.showPopup(
					new AlertPopup(`
Hi! External database is now public
To enable go to Settings > General > space-cee database
Reliability is not guarateed, but this should not affect your current saves
Join our community server for more information.
`),
				);
			}
		});
	}
}
