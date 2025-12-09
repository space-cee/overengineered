import { Players, ReplicatedStorage, RunService } from "@rbxts/services";
import { PlayerRank } from "engine/shared/PlayerRank";

export namespace GameDefinitions {
	export const isOfficialAwms = ReplicatedStorage.FindFirstChild("anywaymachines") !== undefined;

	// Building
	export const FREE_SLOTS = 70;
	export const ADMIN_SLOTS = 100 - FREE_SLOTS;

	export const MAX_ANGULAR_SPEED = 40;
	export const HEIGHT_OFFSET = -16384;

	const icicle = 101023772575559;
	export const isTesting = true || game.PlaceId === icicle;

	export function getMaxSlots(player: Player, additional: number) {
		let max = FREE_SLOTS + additional;
		if (PlayerRank.isAdmin(player)) max += ADMIN_SLOTS;

		return max;
	}

	export function getEnvironmentInfo(): readonly string[] {
		const ret = [];

		ret.push(isOfficialAwms ? `[Official awms build]` : "[Unofficial build]");
		if (Players.LocalPlayer) {
			ret.push(
				`User: ${Players.LocalPlayer.UserId} @${Players.LocalPlayer.Name} ${Players.LocalPlayer.DisplayName}`,
			);
		} else {
			ret.push("Server");
		}

    	ret.push(`Build: ${true ? "🔒 Studio" : game.PlaceVersion}`);
		ret.push(`Server: ${true ? "🔒 Studio" : game.JobId}`);

		return ret;
	}
}
