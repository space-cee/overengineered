import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { PartialControl } from "engine/client/gui/PartialControl";
import { Strings } from "engine/shared/fixes/String.propmacro";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

type ListDefinition = GuiObject & {
	readonly SlotTemplate: GuiObject & {
		readonly IdText: TextLabel;
		readonly Data: GuiObject & {
			readonly LoadButton: GuiButton;
			readonly Date: GuiObject & {
				readonly PrettyDateText: TextLabel;
				readonly DateText: TextLabel;
			};
		};
	};
};

const template = Interface.getInterface<{
	Popups: { Crossplatform: { SlotHistory: GuiObject } };
}>().Popups.Crossplatform.SlotHistory;
template.Visible = false;

type SlotsPopupParts = {
	readonly CloseButton: TextButton;
	readonly SlotList: ListDefinition;
	readonly TitleLabel: TextLabel;
};

export class SaveHistoryPopup extends PartialControl<SlotsPopupParts> {
	constructor(history: SlotHistory) {
		super(template.Clone());

		this.parts.TitleLabel.Text = `SLOT HISTORY FOR D${history.databaseSlotId}`;

		this.$onInjectAuto((playerData: PlayerDataStorage) => {
			this.parent(new ButtonControl(this.parts.CloseButton, () => this.hide()));

			const slotTemplate = this.asTemplate(this.parts.SlotList.SlotTemplate);
			const templates = this.parent(new Control(this.parts.SlotList));

			for (const part of history.history) {
				const gui = slotTemplate();
				const control = templates.add(new Control(gui));

				gui.IdText.Text = part.id;
				gui.Data.Date.DateText.Text = part.createdAt;
				gui.Data.Date.PrettyDateText.Text = Strings.prettySecondsAgo(
					DateTime.now().UnixTimestamp - DateTime.fromIsoDate(part.createdAt)!.UnixTimestamp,
				);

				control
					.add(new Control(gui.Data.LoadButton)) //
					.addButtonAction(() => {
						this.hide();

						const settings = playerData.config.get();
						playerData.loadPlayerSlotFromHistory(
							part.slotId,
							part.id,
							undefined,
							settings.useSpaceCee ?? false,
						);
					});
			}
		});
	}
}
