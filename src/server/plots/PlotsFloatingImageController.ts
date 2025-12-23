import { Players, ReplicatedStorage } from "@rbxts/services";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { PlayerRank } from "engine/shared/PlayerRank";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { SharedPlots } from "shared/building/SharedPlots";

@injectable
export class PlotsFloatingImageController extends Component {
	constructor(@inject plots: SharedPlots) {
		super();

		for (const plot of plots.plots) {
			this.parent(new PlotFloatingImageController(plot));
		}
	}
}

class PlotFloatingImageController extends Component {
	constructor(plot: SharedPlot) {
		super();

		const container = this.parent(new ComponentChild());

		const create = (player: Player) => {
			const gui = ReplicatedStorage.Assets.Guis.PlotOwnerGui.Clone();

			gui.UserImage.Image = Players.GetUserThumbnailAsync(
				player.UserId,
				Enum.ThumbnailType.AvatarThumbnail,
				Enum.ThumbnailSize.Size420x420,
			)[0];

			gui.DisplayNameLabel.Text = player.DisplayName;
			gui.UsernameLabel.Text = `@${player.Name}`;
			gui.Parent = plot.instance;
			gui.Adornee = plot.instance.FindFirstChild("BuildingArea") as BasePart;

			// ────────────────────────────────────────────────
			// Special-case rank tags (same as ChatController)
			// ────────────────────────────────────────────────

			if (PlayerRank.isAdmin(player)) {

				// 894261194 → "Cee" (gold)
				if (player.UserId === 894261194) {
					gui.RankLabel.Text = "Cee";
					gui.RankLabel.TextColor3 = Color3.fromRGB(255, 215, 0); // #FFD700

				// Creator → "Founder" (red)
				} else if (player.UserId === game.CreatorId) {
					gui.RankLabel.Text = "Founder";
					gui.RankLabel.TextColor3 = Color3.fromRGB(255, 85, 85); // #ff5555

				// 3721277196 → "silly" (pink)
				} else if (player.UserId === 3721277196) {
					gui.RankLabel.Text = "silly";
					gui.RankLabel.TextColor3 = Color3.fromRGB(255, 0, 106); // #FF006A

				// 1745850275 → "Admin" (blue)
				} else if (player.UserId === 1745850275) {
					gui.RankLabel.Text = "Admin";
					gui.RankLabel.TextColor3 = Color3.fromRGB(0, 0, 255); // #0000FF

				// 1631949626 → "Femboy 😍♂️" (rainbow)
				} else if (player.UserId === 1631949626) {
					gui.RankLabel.Text = "Femboy 😍";
					spawn(() => {
						while (gui && gui.FindFirstChild("RankLabel")) {
							const t = 5;
							const hue = (tick() % t) / t;
							const colorrr = Color3.fromHSV(hue, 1, 1);
							gui.RankLabel.TextColor3 = colorrr;
							task.wait();
						}
					});

				// 3808300766 → "silly" (black)
				} else if (player.UserId === 3808300766) {
					gui.RankLabel.Text = "silly";
					gui.RankLabel.TextColor3 = Color3.fromRGB(0, 0, 0); // #000000

				// 1852595158 → "Jenny" (purple #5D3FD3)
				} else if (player.UserId === 1852595158) {
					gui.RankLabel.Text = "Jenny";
					gui.RankLabel.TextColor3 = Color3.fromRGB(93, 63, 211); // #5D3FD3
				// 2224103343 → "GPU Eater" (#FFADF3)
				} else if (player.UserId === 2224103343) {
					gui.RankLabel.Text = "GPU Eater";
					gui.RankLabel.TextColor3 = Color3.fromRGB(255, 173, 243); // #FFADF3

				// Default admin → "Developer" (rainbow)
				} else {
					gui.RankLabel.Text = "Developer";
					spawn(() => {
						while (gui && gui.FindFirstChild("RankLabel")) {
							const t = 5;
							const hue = (tick() % t) / t;
							const colorrr = Color3.fromHSV(hue, 1, 1);
							gui.RankLabel.TextColor3 = colorrr;
							task.wait();
						}
					});
				}
			}

			return new InstanceComponent(gui);
		};

		// Subscribe to ownerId changes
		this.event.subscribeObservable(plot.ownerId, (owner) => {
			container.clear();

			if (owner !== undefined) {
				const player = Players.GetPlayerByUserId(owner);
				if (player) container.set(create(player));
			}
		});
	}
}
