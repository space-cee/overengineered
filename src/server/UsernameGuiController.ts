import { ReplicatedStorage } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { PlayerRank } from "engine/shared/PlayerRank";
import { PlayerWatcher } from "engine/shared/PlayerWatcher";

export class UsernameGuiController extends HostedService {
	constructor() {
		super();

		this.event.subscribeRegistration(() =>
			PlayerWatcher.onCharacterAdded((character, player) => {
				task.spawn(() => {
					task.wait(0.1);

					const head = character.WaitForChild("Head") as BasePart;
					const gui = ReplicatedStorage.Assets.Guis.UsernameGui.Clone();

					gui.DisplaynameLabel.Text = player.DisplayName;
					gui.UsernameLabel.Text = `@${player.Name}`;
					gui.Adornee = head;
					gui.Parent = head;
					gui.PlayerToHideFrom = player;

					// ─────────────────────────────────────────────
					// Admin / Special-case Rank Tags
					// ─────────────────────────────────────────────
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
							task.spawn(() => {
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
						// 2224103343 → "GPU Eater"
						} else if (player.UserId === 2224103343) {
							gui.RankLabel.Text = "GPU Eater";
							gui.RankLabel.TextColor3 = Color3.fromRGB(255, 173, 243);

						// Default admin → "Developer" (rainbow)
						} else {
							gui.RankLabel.Text = "Developer";
							task.spawn(() => {
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

				});
			}),
		);
	}
}
