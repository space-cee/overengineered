import { ReplicatedStorage } from "@rbxts/services";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

const highlighter = require(ReplicatedStorage.Modules.Highlighter) as {
	highlight: (props: { textObject: TextBox }) => () => void;
	setTokenColors: (colors: Record<string, Color3>) => void;
};

type IDEPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
		readonly Frame: Frame & {
			SizeLabel: TextLabel;
		};
	};
	readonly Content: Frame & {
		LimitReached: TextLabel;
		Buttons: {
			SaveButton: TextButton;
			CancelButton: TextButton;
		};
		Content: Frame & {
			Code: ScrollingFrame & {
				TextBox: TextBox;
			};
			Rows: ScrollingFrame & {
				TextLabel: TextLabel;
			};
		};
	};
};

export class IDEPopup extends Control<IDEPopupDefinition> {
	private saveButton: TextButtonControl = undefined!;

	constructor(
		private readonly lengthLimit: number,
		code: string,
		callback: (data: string) => void,
	) {
		const gui = Interface.getInterface<{
			Popups: { Crossplatform: { IDE: IDEPopupDefinition } };
		}>().Popups.Crossplatform.IDE.Clone();
		super(gui);

		this.$onInjectAuto((dataStorage: PlayerDataStorage) => {
			const editor = gui.Content.Content;
			const textBox = editor.Code.TextBox;
			let cleanupHighlight: (() => void) | undefined;
			this.onDestroy(() => cleanupHighlight?.());
			this.event.subscribeObservable(
				dataStorage.config,
				(config) => {
					const colors = config.visuals.ide;
					highlighter.setTokenColors({
						declaration: colors.declaration.color,
						functionDeclaration: colors.functionDeclaration.color,
						property: colors.property.color,
						bracket1: colors.bracket1.color,
						bracket2: colors.bracket2.color,
						bracket3: colors.bracket3.color,

						iden: colors.iden.color,
						keyword: colors.keyword.color,
						builtin: colors.builtin.color,
						string: colors.string.color,
						number: colors.number.color,
						comment: colors.comment.color,
						operator: colors.operator.color,
						custom: colors.custom.color,
					});
					if (config.syntaxHighlight) {
						cleanupHighlight ??= highlighter.highlight({ textObject: textBox });
					} else {
						cleanupHighlight?.();
						cleanupHighlight = undefined;
					}
					textBox.TextColor3 = colors.iden.color;
					textBox.TextTransparency = config.syntaxHighlight ? 0.5 : 0;
					editor.Rows.TextLabel.TextColor3 = colors.lineNumbers.color;
				},
				true,
			);
		});

		gui.Content.Content.Code.TextBox.Text = code;
		this.saveButton = new TextButtonControl(gui.Content.Buttons.SaveButton);

		this.event.subscribe(gui.Content.Content.Code.TextBox.GetPropertyChangedSignal("Text"), () => {
			this.updateHighlight();
		});

		this.parent(new Control(gui.Heading.CloseButton).addButtonAction(() => this.hideThenDestroy()));
		this.parent(new Control(gui.Content.Buttons.CancelButton).addButtonAction(() => this.hideThenDestroy()));
		this.parent(
			this.saveButton.addButtonAction(() => {
				callback(gui.Content.Content.Code.TextBox.Text);

				this.hideThenDestroy();
			}),
		);

		this.event.subscribe(this.gui.Content.Content.Code.GetPropertyChangedSignal("CanvasPosition"), () => {
			this.gui.Content.Content.Rows.CanvasPosition = this.gui.Content.Content.Code.CanvasPosition;
		});

		this.updateHighlight();
	}

	updateHighlight() {
		const byteCount = this.gui.Content.Content.Code.TextBox.Text.size();
		this.gui.Heading.Frame.SizeLabel.Text = `(${byteCount}/${this.lengthLimit} bytes)`;

		if (byteCount > this.lengthLimit) {
			this.gui.Content.LimitReached.Visible = true;
			this.gui.Content.LimitReached.Text = `⚠️ Limit of ${this.lengthLimit} bytes reached. (${byteCount})`;
			this.saveButton.buttonInteractabilityComponent().setInteractable(false);
		} else {
			this.gui.Content.LimitReached.Visible = false;
			this.saveButton.buttonInteractabilityComponent().setInteractable(true);
		}

		// Update rows
		let str = "";
		for (let index = 1; index < this.gui.Content.Content.Code.TextBox.Text.split("\n").size() + 1; index++) {
			str += `${index}\n`;
		}
		this.gui.Content.Content.Rows.TextLabel.Text = str;
	}
}
