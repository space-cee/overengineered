local TeleportService = game:GetService("TeleportService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

local joinEvent = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("JoinPrivateServer")

local serverStore = DataStoreService:GetDataStore("PrivateServers_V1")

-------------------------------------------------
-- JOIN / CREATE
-------------------------------------------------

joinEvent.OnServerEvent:Connect(function(player, customCode)

	if typeof(customCode) ~= "string" then return end

	-- clean input
	customCode = customCode:lower():gsub("%s+", "")

	-- validation
	if customCode == "" then
		joinEvent:FireClient(player, "InvalidCode")
		return
	end

	if #customCode > 20 then
		joinEvent:FireClient(player, "TooLong")
		return
	end

	local reservedCode

	-- try load
	local success, result = pcall(function()
		return serverStore:GetAsync(customCode)
	end)

	if success and result then
		reservedCode = result
	else
		-- create new
		reservedCode = TeleportService:ReserveServer(game.PlaceId)

		pcall(function()
			serverStore:SetAsync(customCode, reservedCode)
		end)
	end

	-- tell client we're teleporting
	joinEvent:FireClient(player, "Teleporting")

	TeleportService:TeleportToPrivateServer(
		game.PlaceId,
		reservedCode,
		{player}
	)

end)