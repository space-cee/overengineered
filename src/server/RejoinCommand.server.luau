-- Put in ServerScriptService
-- Written by @WWolfite (@Wolfite_) on 8 Jan, 2023

-- May not work in single player servers sometimes. Does not work in studio.

game.Players.PlayerAdded:Connect(function(plr)
	plr.Chatted:Connect(function(msg)
		if msg == "/rejoin" then
			game:GetService("TeleportService"):Teleport(game.PlaceId, plr, {feature="rejoin";source="game"})
		end
	end)
end)