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

			if (lastJoin < DateTime.fromUniversalTime(2025, 5, 9, 4, 38).UnixTimestamp) {
				popupController.showPopup(
					new AlertPopup(`
Hi! This is the first update coming back to TS 
Things will break, let us know in bug reports
Join our community server for more information.
`),
				);
			}
		});
	}
}
