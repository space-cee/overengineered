local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local SwimmingController = require(ReplicatedStorage:WaitForChild("TS"):WaitForChild("SwimmingController"))

--local character = player.Character or player.CharacterAdded:Wait()

local swimmingController = SwimmingController.new(player)

_G.SwimmingController = swimmingController