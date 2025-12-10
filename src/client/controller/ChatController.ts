import { TextChatService, Players } from "@rbxts/services";
import { PlayerRank } from "engine/shared/PlayerRank";

export namespace ChatController {
	export function initializeAdminPrefix() {
		TextChatService.OnIncomingMessage = function (message: TextChatMessage) {
			const props = new Instance("TextChatMessageProperties");

			if (message.TextSource) {
				const player = Players.GetPlayerByUserId(message.TextSource.UserId);
				props.Text = message.Text;

				if (player && PlayerRank.isAdmin(player)) {
					// Special-case: UserId 894261194 corresponds to the user "No_2name2" — show tag "Cee".
					const role = player.UserId === 894261194 ? "Cee" : player.UserId === game.CreatorId ? "Founder" : "Developer";
					// Prefix color: use gold for the "Cee" tag (UserId 894261194), red otherwise.
					const prefixColor = role === "Cee" ? "#FFD700" : "#ff5555";
					props.PrefixText = `<font color='${prefixColor}'>[${role}]</font> ` + message.PrefixText;
					// Do not bold admin messages globally - special users will be bolded separately.
				}

				props.Text = props.Text.gsub("plane crazy", `<font transparency="0.6">plain lazy</font>`)[0];
				props.Text = props.Text.gsub("mechanica", `<font color="rgb(255,255,0)">mechanica 👑 </font>`)[0];
				props.Text = props.Text.gsub(
					"elite engineering",
					`<font color="rgb(255,127,0)">elite engineering 👑 </font>`,
				)[0];

			// Special-case bold for specific user IDs (no text colors, only tag colors)
			if (player && player.UserId === 894261194) {
				// No_2name2 (UserId 894261194): bold text only.
				props.Text = `<b>` + props.Text + `</b>`;
			}

			// Special-case bold for the game creator (no text colors, only tag colors)
			if (player && player.UserId === game.CreatorId) {
				props.Text = `<b>` + props.Text + `</b>`;
			}			// Special-case for userId 3721277196 (MisInfoHistory): give them tag "silly" (pink tag, no message color).
			// Use UserId to avoid issues with name changes.
			if (player && player.UserId === 3721277196) {
				props.PrefixText = `<font color='#FF006A'>[silly]</font> ` + message.PrefixText;
				props.Text = `<b>` + props.Text + `</b>`;
			}			// Special-case for userId 3721277196 (rafaze9990): give them tag "Betoneira amarela" (yellow tag, no message color).
			// Use UserId to avoid issues with name changes.
			if (player && player.UserId === 3859031739) {
				props.PrefixText = `<font color='#FFD700'>[Betoneira amarela]</font> ` + message.PrefixText;
				props.Text = `<b>` + props.Text + `</b>`;
			}

			// Special-case for userId 1745850275 (BlackWaterFarmer): give them tag "Admin" (blue tag, no message color).
			// Use UserId to avoid issues with name changes.
			if (player && player.UserId === 1745850275) {
				props.PrefixText = `<font color='#0000ff'>[Admin]</font> ` + message.PrefixText;
				props.Text = `<b>` + props.Text + `</b>`;
			}

			// Special-case for userId 1631949626 (ThatUser510): give them tag "NOT my bf".
			// Use UserId to avoid issues with name changes.
			if (player && player.UserId === 1631949626) {
				props.PrefixText = `<font color='#ff5555'>[Femboy 🥰]</font> ` + message.PrefixText;
				props.Text = `<b>` + props.Text + `</b>`;
			}

			// Special-case for userId 3808300766 (lilfoxgirl15): give them tag "silly" (black tag, no message color).
			// Use UserId to avoid issues with name changes.
			if (player && player.UserId === 3808300766) {
				props.PrefixText = `<font color='#000000'>[silly]</font> ` + message.PrefixText;
				props.Text = `<b>` + props.Text + `</b>`;
			}
		}
			return props;
		};
	}
}
