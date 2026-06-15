local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ConfigService = game:GetService("ConfigService")

-- Fetch dynamic endpoints from ConfigService
local config = ConfigService:GetConfigAsync()
local AWMS_ENDPOINT = "awms_endpoint"
local awms_endpoint = config:GetValue(AWMS_ENDPOINT)
local LOCAL_ENDPOINT = "local_endpoint"
local local_endpoint = config:GetValue(LOCAL_ENDPOINT)

local ALLOWED_USER_IDS = {
	894261194, --me
	238427763, --FtRookie
}

local AI_ASLEEP_MESSAGE = "AI is asleep"
local NO_PERMISSION_MESSAGE = "Not enough permissions lol. No AI gf for u."

local rf = ReplicatedStorage:FindFirstChild("AiChatRF")
if not rf then
	rf = Instance.new("RemoteFunction")
	rf.Name = "AiChatRF"
	rf.Parent = ReplicatedStorage
end

local activeRequests = {}

-- Rate limiting
local RATE_LIMIT_SECONDS = 10
local lastRequestTime = {}
local RATE_LIMIT_BYPASS_USER_IDS = {
	[894261194] = true, -- me
	[238427763] = true, -- FtRookie
}

Players.PlayerRemoving:Connect(function(player)
	local id = tostring(player.UserId)
	lastRequestTime[id] = nil
	activeRequests[id] = nil
end)

local CLIENT_URL_MAPPING = {
	["https://roblox-ai-server-nhl4.onrender.com/chat"] = awms_endpoint,
	["https://extraembryonic-decorously-brandi.ngrok-free.dev/chat"] = local_endpoint,
	["https://88149eff-2e77-479b-b96c-b3172e73679d-00-2zp5kys672x9r.spock.replit.dev/chat"] = "https://88149eff-2e77-479b-b96c-b3172e73679d-00-2zp5kys672x9r.spock.replit.dev/chat",
}

local EMOJI_TO_EMOTICON = {
	["😀"] = ":D", ["😃"] = ":D", ["😄"] = ":D", ["😁"] = ":D",
	["😆"] = ":D", ["😅"] = ":')", ["😂"] = ":')", ["🤣"] = ":')",
	["😊"] = "-w-", ["😇"] = "-w-", ["🙂"] = ":)", ["🙃"] = ":)",
	["😉"] = "-w•", ["😌"] = "-w-", ["😍"] = "<3", ["🥰"] = "<3",
	["😘"] = ":*", ["😗"] = ":*", ["😙"] = ":*", ["😚"] = ":*",
	["😋"] = ":P", ["😛"] = ":P", ["😝"] = ":P", ["😜"] = ";P",
	["🤪"] = ":P", ["🤨"] = ":/", ["🤔"] = ":/", ["😐"] = ":|",
	["😑"] = ":|", ["😶"] = ":|", ["😬"] = ":/",
	["😮"] = ":O", ["😯"] = ":O", ["😲"] = ":O", ["😳"] = ":O",
	["🤯"] = "O_O",
	["😦"] = ":(", ["😧"] = ":(", ["😨"] = ":(", ["😱"] = "D:",
	["😕"] = ":(", ["🙁"] = ":(", ["☹️"] = ":(",
	["😞"] = "-ʍ-", ["😔"] = "-ʍ-", ["😣"] = "X(",
	["😖"] = ">ʍ<", ["😫"] = "X(", ["😩"] = ":(",
	["😢"] = ":(", ["😭"] = ":'(",
	["😤"] = ">:(", ["😠"] = ">:(", ["😡"] = ">:(", ["🤬"] = ">:(",
	["😪"] = "-_-", ["😴"] = "-_-", ["🤤"] = "-_-",
	["🥴"] = "x_x", ["😵"] = "x_x", ["😵‍💫"] = "x_x",
	["😎"] = "B)", ["🤓"] = ":)", ["🧐"] = ":/",
	["❤️"] = "<3", ["💔"] = "</3",
}

local function replaceFaceEmojis(text)
	for emoji, emoticon in pairs(EMOJI_TO_EMOTICON) do
		text = string.gsub(text, emoji, emoticon)
	end
	return text
end

rf.OnServerInvoke = function(player, message, passedUrl)
	-- Permission check
	if not table.find(ALLOWED_USER_IDS, player.UserId) then
		warn("[AI] Player not allowed to run AI:", player.UserId)
		return NO_PERMISSION_MESSAGE
	end

	local sessionId = tostring(player.UserId)
	local username = player.Name

	-- Prevent overlap
	if activeRequests[sessionId] then
		return "Please wait..."
	end

	if not RATE_LIMIT_BYPASS_USER_IDS[player.UserId] then
		local now = os.clock()
		if lastRequestTime[sessionId] and (now - lastRequestTime[sessionId]) < RATE_LIMIT_SECONDS then
			local remaining = math.ceil(RATE_LIMIT_SECONDS - (now - lastRequestTime[sessionId]))
			return "Please wait " .. remaining .. "s before sending another message."
		end
	end

	-- Validate message
	if type(message) ~= "string" or message == "" then
		return AI_ASLEEP_MESSAGE
	end

	if #message > 2000 then
		return "Message too long."
	end

	-- Dynamic URL validation & routing
	local targetUrl = CLIENT_URL_MAPPING[passedUrl]
	if type(passedUrl) ~= "string" or not targetUrl then
		warn("[AI] Blocked or invalid URL from", player.Name, passedUrl)
		return AI_ASLEEP_MESSAGE
	end

	activeRequests[sessionId] = true

	local function sendRequestWithRetry(payload, url)
		local MAX_RETRIES = 3
		local RETRY_DELAY = 6 

		for attempt = 1, MAX_RETRIES do
			local success, result = pcall(function()
				local response = HttpService:PostAsync(
					url,
					HttpService:JSONEncode(payload),
					Enum.HttpContentType.ApplicationJson
				)
				return HttpService:JSONDecode(response)
			end)

			if success and type(result) == "table" then
				return true, result
			end

			warn("[AI] Attempt failed, retrying...", attempt)
			task.wait(RETRY_DELAY)
		end

		return false, nil
	end

	local payload = {
		sessionId = sessionId,
		message = ("Username: %s\nMessage: %s"):format(username, message),
	}

	local success, result = sendRequestWithRetry(payload, targetUrl)

	activeRequests[sessionId] = nil

	if not RATE_LIMIT_BYPASS_USER_IDS[player.UserId] then
		lastRequestTime[sessionId] = os.clock()
	end

	if not success or type(result) ~= "table" then
		warn("[AI] Request failed:", result)
		return AI_ASLEEP_MESSAGE
	end

	if type(result.reply) ~= "string" or result.reply == "" then
		return AI_ASLEEP_MESSAGE
	end

	return replaceFaceEmojis(result.reply)
end