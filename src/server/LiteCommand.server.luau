local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local LITE_PLACE_ID = 126407015912032 -- replace with your Lite place ID

Players.PlayerAdded:Connect(function(player)
	player.Chatted:Connect(function(message)
		if string.lower(message) == "!lite" then
			TeleportService:Teleport(LITE_PLACE_ID, player)
		end
	end)
end)