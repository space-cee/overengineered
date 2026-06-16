local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local BlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").BlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local ComponentEvents2Macros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "component", "ComponentEvents.propmacro").ComponentEvents2Macros
local RunService = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").RunService
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
local GameDefinitions = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "data", "GameDefinitions").GameDefinitions

local definition = {
	inputOrder = {
		"next",
		"prev",
		"detectSelf",
		"localPosition",
	},
	input = {
		next = {
			displayName = "Next Player",
			types = {
				bool = {
					config = false,
				},
			},
		},
		prev = {
			displayName = "Previous Player",
			types = {
				bool = {
					config = false,
				},
			},
		},
		detectSelf = {
			displayName = "Detect Self",
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
		playerName = {
			displayName = "Player Name",
			types = { "string" },
		},
		playerPosition = {
			displayName = "Player Position",
			types = { "vector3" },
		},
		playerCount = {
			displayName = "Player Count",
			types = { "number" },
		},
		currentIndex = {
			displayName = "Current Index",
			types = { "number" },
		},
	},
}

local Logic
do
	local super = BlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/PlayerLocatorBlock2.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic
	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end
	function Logic:constructor(block)
		super.constructor(self, definition, block)

		local inputValues = {
			next = false,
			prev = false,
			detectSelf = false,
			localPosition = false,
		}

		self:on(function(data)
			inputValues = data
			return inputValues
		end)

		local currentIndex = 1
		local prevNext = false
		local prevPrev = false
		local owner = Players.LocalPlayer
		local offset = Vector3.new(0, -GameDefinitions.HEIGHT_OFFSET, 0)
		local origin = block.instance:GetPivot().Position

local _event = self.event
        local _stepped = RunService.Stepped
        local _a = _event
        local _1 = function()
            -- Build player list
            local playerList = {}
            for _, p in Players:GetPlayers() do
                -- Skip self if detectSelf is false
                if not inputValues.detectSelf and p == owner then continue end
                local character = p.Character
                if not character then continue end
                local rootPart = character:FindFirstChild("HumanoidRootPart")
                if not rootPart then continue end
                local position
                if inputValues.localPosition then
                    position = rootPart.Position - origin
                else
                    position = rootPart.Position + offset
                end
                table.insert(playerList, {
                    name = p.Name,
                    position = position,
                })
            end

            local count = #playerList

            if count == 0 then
                self.output.playerName:set("string", "")
                self.output.playerPosition:set("vector3", Vector3.zero)
                self.output.playerCount:set("number", 0)
                self.output.currentIndex:set("number", 0)
                return
            end

            -- Clamp index to valid range
            if currentIndex > count then currentIndex = 1 end
            if currentIndex < 1 then currentIndex = count end

            -- Detect rising edge on next button
            local nextPressed = inputValues.next
            if nextPressed and not prevNext then
                currentIndex = currentIndex + 1
                if currentIndex > count then currentIndex = 1 end
            end
            prevNext = nextPressed

            -- Detect rising edge on prev button
            local prevPressed = inputValues.prev
            if prevPressed and not prevPrev then
                currentIndex = currentIndex - 1
                if currentIndex < 1 then currentIndex = count end
            end
            prevPrev = prevPressed

            -- Output current player
            local current = playerList[currentIndex]
            self.output.playerName:set("string", current.name)
            self.output.playerPosition:set("vector3", current.position)
            self.output.playerCount:set("number", count)
            self.output.currentIndex:set("number", currentIndex)
        end
        local _2 = if type(_a) == "table" and _a.subscribe ~= nil then _a.subscribe(_a, _stepped, _1) else ComponentEvents2Macros.subscribe(_a, _stepped, _1)

		self:onDisable(function()
			self.output.playerName:set("string", "")
			self.output.playerPosition:set("vector3", Vector3.zero)
			self.output.playerCount:set("number", 0)
			self.output.currentIndex:set("number", 0)
		end)
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "playerlocatorblock2"
_object.displayName = "Player Locator 2"
_object.description = "The block knows where everyone is"
_object.search = {
	partialAliases = { "player detect", "player track", "player position" },
}
_object.logic = {
	definition = definition,
	ctor = Logic,
}
_object.modelSource = {
	model = BlockCreation.Model.fAutoCreated("x4GenericLogicBlockPrefab", "Player Locator 2"),
	category = function()
		return BlockCreation.Categories.other
	end,
}
local PlayerLocatorBlock2 = _object
return {
	PlayerLocatorBlock2Logic = Logic,
	PlayerLocatorBlock2 = PlayerLocatorBlock2,
}