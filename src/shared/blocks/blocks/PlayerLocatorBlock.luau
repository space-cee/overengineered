-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))

local ComponentEvents2Macros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "component", "ComponentEvents.propmacro").ComponentEvents2Macros

local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local RunService = _services.RunService

local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local GameDefinitions = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "data", "GameDefinitions").GameDefinitions

local definition = {

	inputOrder = { "ignoreOwner", "localPosition" },
	outputOrder = { "coordinates", "name" },

	input = {
		ignoreOwner = {
			displayName = "Ignore Owner",
			types = {
				bool = {
					config = false,
				},
			},
		},

		localPosition = {
			displayName = "Local Position",
			types = {
				bool = {
					config = false,
				},
			},
		},
	},

	output = {
		coordinates = {
			displayName = "Player Coordinates",
			unit = "Position",
			types = { "vector3" },
		},
		name = {
			displayName = "Closest Player",
			unit = "Player Name",
			types = { "string" },
		},
	},
}

local Logic
do
	local super = InstanceBlockLogic

	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__index = super,
	})

	Logic.__index = Logic

	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block)

		super.constructor(self, definition, block)

		local ignoreOwner = self:initializeInputCache("ignoreOwner")
		local localPosition = self:initializeInputCache("localPosition")

		local offset = Vector3.new(0, -GameDefinitions.HEIGHT_OFFSET, 0)

		local owner = Players.LocalPlayer

		local _event = self.event
		local _postSimulation = RunService.PostSimulation

		local event = _event

		local _1 = function()

			local origin = block.instance:GetPivot().Position

			local closestPlayer = nil
			local closestPart = nil
			local closestDistance = math.huge

			for event, player in Players:GetPlayers() do

				if ignoreOwner.get() and player == owner then
					continue
				end

				local character = player.Character

				if character then
					local hrp = character:FindFirstChild("HumanoidRootPart")

					if hrp then

						local dist = (hrp.Position - origin).Magnitude

						if dist < closestDistance then
							closestDistance = dist
							closestPlayer = player
							closestPart = hrp
						end

					end
				end
			end

			if not closestPart then
				return
			end

			self.output.name:set("string", closestPlayer.Name)

			local result

			if localPosition.get() then
				-- local offset relative to block
				result = (closestPart.Position - origin)
			else
				-- global GPS position
				result = closestPart.Position + offset
			end

			self.output.coordinates:set("vector3", result)

		end

		if type(event) == "table" and event.subscribe ~= nil then
			event.subscribe(event, _postSimulation, _1)
		else
			ComponentEvents2Macros.subscribe(event, _postSimulation, _1)
		end
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)

_object.id = "playerlocator"
_object.displayName = "Player Locator"
_object.description = "Tracks the closest player and returns their GPS coordinates"

_object.logic = {
	definition = definition,
	ctor = Logic,
}

local PlayerLocatorBlock = _object

return {
	PlayerLocatorBlockLogic = Logic,
	PlayerLocatorBlock = PlayerLocatorBlock,
}
