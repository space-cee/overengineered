import { ConfigService, HttpService, RunService, ServerScriptService } from "@rbxts/services";
import { JSON } from "engine/shared/fixes/Json";
import { isNotAdmin_AutoBanned } from "server/BanAdminExploiter";
import { BlocksSerializer } from "shared/building/BlocksSerializer";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabaseData } from "server/database/PlayerDatabase";
import type { LatestSerializedBlocks } from "shared/building/BlocksSerializer";

type errType = "HTTP" | "OUT_OF_INDEX" | "NOT_FOUND" | "INCORRECT_TOKEN";
export type ExternalError = {
	error: string;
	err_type: errType;
};
type SlotKeys = [ownerID: number, slotID: number];
export type ExternalSlot = {
	index: number;
	blocks: BlocksSerializer.JsonSerializedBlocks;
};

export type MigrationResponse = {
	metadata: "SUCCESS" | "FAIL";
	saves: "SUCCESS" | "FAIL";
};

const getExternalBaseUrl = (useSpaceCee = false) =>
	useSpaceCee ? "https://api.space-cee.com/overengineered" : "https://www.ftrookie.com/overengineered";

const parseExternalError = (body: string): (Partial<ExternalError> & { status?: string }) | undefined => {
	try {
		return JSON.deserialize<Partial<ExternalError> & { status?: string }>(body);
	} catch {
		return undefined;
	}
};

const ParseData = (data: string): LatestSerializedBlocks | undefined => {
	try {
		const p1 = JSON.deserialize(data) as { data: string | BlocksSerializer.JsonSerializedBlocks };
		const p2 = (
			typeOf(p1.data) === "string" ? JSON.deserialize(p1.data as string) : p1.data
		) as BlocksSerializer.JsonSerializedBlocks;
		return BlocksSerializer.jsonToObject(p2);
	} catch {
		error("Failed to parse external save data");
	}
};

let token: string | undefined;
const getToken = (debug = false) => {
	if (token) return token;
	try {
		const configured = ConfigService.GetConfigAsync().GetValue("TOKEN");
		if (typeIs(configured, "string") && configured !== "") {
			if (debug) print("[ExternalDatabase] Write token source: Roblox config TOKEN");
			return (token = configured);
		}
	} catch (e) {
		if (debug) $warn(`[ExternalDatabase] Could not read Roblox config TOKEN: ${tostring(e)}`);
	}
	if (RunService.IsStudio()) {
		const studioToken = ServerScriptService.FindFirstChild("TS")
			?.FindFirstChild("database")
			?.FindFirstChild("studiotoken");
		if (studioToken?.IsA("ModuleScript")) {
			const value = (require(studioToken) as { writetoken?: string }).writetoken;
			if (value) {
				if (debug) print("[ExternalDatabase] Write token source: Studio token file");
				return (token = value);
			}
		}
	}
	return undefined;
};

export namespace ExternalDatabase {
	CustomRemotes.admin.adminMigrateRequest.invoked.Connect((player, arg) => {
		if (isNotAdmin_AutoBanned(player, "adm_request_migration")) return;
		CustomRemotes.admin.adminMigrateReply.send(player, MigratePlayer(arg.from, arg.to));
	});

	export const GetPlayer = (UID: number, useSpaceCee = false): PlayerDatabaseData | undefined => {
		const result = HttpService.RequestAsync({
			Method: "GET",
			Url: `${getExternalBaseUrl(useSpaceCee)}/player/${UID}`,
		});
		assert(result.Body, "RETURNED INVALID DATA");
		if (result.StatusCode === 404) return undefined;
		if (result.StatusCode !== 200) throw `Got HTTP ${result.StatusCode}`;

		const val = (JSON.deserialize(result.Body) as { data: PlayerDatabaseData | string }).data;
		if (typeIs(val, "string")) {
			return JSON.deserialize(val);
		}
		return val;
	};

	export const SetPlayer = (
		UID: number,
		data: PlayerDatabaseData,
		useSpaceCee = false,
		debug = false,
	): ExternalError | { status: string } => {
		const token = getToken(debug);
		if (!token) {
			if (debug)
				print(`[ExternalDatabase] POST ${getExternalBaseUrl(useSpaceCee)}/player ${UID} not sent: no token`);
			return { error: "No token was found", err_type: "INCORRECT_TOKEN" };
		}
		const requestResult = HttpService.RequestAsync({
			Method: "POST",
			Headers: {
				"Content-Type": "application/json",
			},
			Url: `${getExternalBaseUrl(useSpaceCee)}/player`,
			Body: JSON.serialize({
				playerID: tostring(UID),
				data, // Technically different from how processed player data is inserted
				token,
			}),
		});
		if (debug) {
			const response = parseExternalError(requestResult.Body);
			print(
				`[ExternalDatabase] POST ${getExternalBaseUrl(useSpaceCee)}/player ${UID} HTTP ${requestResult.StatusCode}: ${response?.status ?? response?.error ?? "no status in response"}`,
			);
		}
		if (requestResult.StatusCode === 404) return { err_type: "HTTP", error: "404 Bad Request" };
		if (requestResult.StatusCode !== 200) throw `Got HTTP ${requestResult.StatusCode}`;
		return JSON.deserialize<ExternalError | { status: string }>(requestResult.Body);
	};

	// Probably unnecessary now
	// export const GetSaves = (ownerID: number): ExternalSlot[] | undefined => {
	// 	const result = HttpService.RequestAsync({
	// 		Method: "GET",
	// 		Url: `https://www.ftrookie.com/overengineered/save/${ownerID}`,
	// 	});
	// 	if (result.StatusCode === 404 || result.Body === '{"error":"Not found"}') {
	// 		return undefined;
	// 	}
	// 	if (result.StatusCode !== 200) {
	// 		throw `Got HTTP ${result.StatusCode}`;
	// 	}
	// 	const val = (
	// 		JSON.deserialize(result.Body) as {
	// 			saves: ExternalSlot[];
	// 		}
	// 	).saves.map((es) => ({ ...es, index: tonumber(es.index) }) as ExternalSlot);
	// 	return val;
	// };

	export const GetSave = ([ownerID, slotID]: SlotKeys, useSpaceCee = false): LatestSerializedBlocks | undefined => {
		const firstResponse = HttpService.RequestAsync({
			Method: "GET",
			Url: `${getExternalBaseUrl(useSpaceCee)}/save/${ownerID}/${slotID}/0`,
		});
		if (firstResponse.StatusCode === 404) return;
		if (firstResponse.StatusCode !== 200) throw `Got HTTP ${firstResponse.StatusCode}`;
		const firstError = parseExternalError(firstResponse.Body);
		if (firstError?.err_type === "NOT_FOUND") return;
		if (firstError?.error) throw firstError.error;

		let result = firstResponse.Body;
		try {
			const v = ParseData(result);
			return v;
		} catch {
			for (let pageIndex = 1; ; pageIndex++) {
				const response = HttpService.RequestAsync({
					Method: "GET",
					Url: `${getExternalBaseUrl(useSpaceCee)}/save/${ownerID}/${slotID}/${pageIndex}`,
				});
				if (response.StatusCode === 404) break;
				if (response.StatusCode !== 200) throw `Got HTTP ${response.StatusCode}`;

				const page = parseExternalError(response.Body);
				if (page?.err_type === "OUT_OF_INDEX") break;
				if (page?.error) throw page.error;
				result += response.Body;
			}
		}

		const val = ParseData(result);
		return val;
	};

	export const SaveSlot = (
		UID: number,
		slot: ExternalSlot,
		useSpaceCee = false,
		debug = false,
	): ExternalError | { status: string } => {
		const token = getToken(debug);
		if (!token) {
			if (debug)
				print(
					`[ExternalDatabase] POST ${getExternalBaseUrl(useSpaceCee)}/save ${UID}/${slot.index} not sent: no token`,
				);
			return { error: "No token was found", err_type: "INCORRECT_TOKEN" };
		}
		const requestResult = HttpService.RequestAsync({
			Method: "POST",
			Headers: {
				"Content-Type": "application/json",
			},
			Url: `${getExternalBaseUrl(useSpaceCee)}/save`,
			Body: JSON.serialize({
				playerID: tostring(UID),
				index: tostring(slot.index),
				data: { data: slot.blocks }, // Studio testing indicates this did not work but maybe its different
				token,
			}),
		});
		if (debug) {
			const response = parseExternalError(requestResult.Body);
			print(
				`[ExternalDatabase] POST ${getExternalBaseUrl(useSpaceCee)}/save ${UID}/${slot.index} HTTP ${requestResult.StatusCode}: ${response?.status ?? response?.error ?? "no status in response"}`,
			);
		}
		if (requestResult.StatusCode === 404) return { err_type: "HTTP", error: "404 Bad Request" };
		if (requestResult.StatusCode !== 200) throw `Got HTTP ${requestResult.StatusCode}`;
		return JSON.deserialize<ExternalError | { status: string }>(requestResult.Body);
	};

	export const MigratePlayer = (fromPlayer: number, toPlayer: number, useSpaceCee = false): MigrationResponse => {
		const token = getToken(true);
		if (!token) return { metadata: "FAIL", saves: "FAIL" } as MigrationResponse;
		print(`Migrating saves from ${fromPlayer} to ${toPlayer}`);

		// curl -X POST -H "Content-Type: application/json" -d '{"fromID":"238427763", "toID":"10897692300", "token":""}' https://ftrookie.com/overengineered/migrate
		const requestResult = HttpService.RequestAsync({
			Method: "POST",
			Headers: {
				"Content-Type": "application/json",
			},
			Url: `${getExternalBaseUrl(useSpaceCee)}/migrate`,
			Body: JSON.serialize({
				fromID: tostring(fromPlayer),
				toID: tostring(toPlayer),
				token,
			}),
		});
		if (requestResult.StatusCode === 404) return { metadata: "FAIL", saves: "FAIL" } as MigrationResponse;
		if (requestResult.StatusCode !== 200) throw `Got HTTP ${requestResult.StatusCode}`;
		return JSON.deserialize<MigrationResponse>(requestResult.Body);
	};
}
