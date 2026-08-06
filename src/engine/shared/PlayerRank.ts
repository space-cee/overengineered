import { RunService } from "@rbxts/services";
export namespace PlayerRank {
	const founder = 894261194;

	export const developers: readonly number[] = [
		10897692300, // Maks_gaming2
		8377191303, // samlovedeveloping
		8215244948, // rickjealous139
		894261194, // No_2name2
	];

	export const moderators: readonly number[] = [
		10897692300, // Maks_gaming2
		8377191303, // samlovedeveloping
		8215244948, // rickjealous139
		894261194, // No_2name2
		3838154461, // v3rve
	];
	export const loaders: readonly number[] = [
		3838154461, // v3rve
		3162050105,
		4091587604,
		1476953333,
		8380190370,
		3687645915,
	];

	export function isFounder(player: Player | number): boolean {
		if (typeOf(player) === "number") return player === founder;
		if (typeOf(player) === "Instance" && (player as Instance).IsA("Player"))
			return (player as Player).UserId === founder;
		return false;
	}

	export function isDev(player: Player): boolean {
		if (RunService.IsStudio()) return true;
		return developers.includes(player.UserId) || isFounder(player);
	}
	export function isDevById(playerId: number): boolean {
		if (RunService.IsStudio()) return true;
		return developers.includes(playerId) || isFounder(playerId);
	}

	export function isMod(player: Player): boolean {
		if (RunService.IsStudio()) return true;
		return moderators.includes(player.UserId) || isFounder(player);
	}
	export function isModById(playerId: number): boolean {
		if (RunService.IsStudio()) return true;
		return moderators.includes(playerId) || isFounder(playerId);
	}
	export function isLoader(player: Player): boolean {
		if (RunService.IsStudio()) return true;
		return loaders.includes(player.UserId) || isFounder(player);
	}
}
