-- UnscaledScreenBlock.lua
-- Clean version (fonts removed)

local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))

local TTypeMacros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t.propmacro").TTypeMacros
local Instances = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "fixes", "Instances").Instances
local Strings = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "fixes", "String.propmacro").Strings
local t = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t").t

local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockLogicTypes = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogicTypes").BlockLogicTypes
local BlockSynchronizer = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockSynchronizer").BlockSynchronizer
local BlockConfigDefinitions = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockConfigDefinitions").BlockConfigDefinitions
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation

----------------------------------------------------------------
-- Block definition (NO FONT)
----------------------------------------------------------------

local definition = {
	input = {
		data = {
			displayName = "Data",
			types = BlockConfigDefinitions.any,
		},
		textColor = {
			displayName = "Text Color",
			types = {
				color = {
					config = Color3.new(1, 1, 1),
				},
			},
		},
	},
	output = {},
}

----------------------------------------------------------------
-- Update event typing
----------------------------------------------------------------

local _object = {}
local _left = "block"

local _ = t.instance("Model")
local _1 = if type(_) == "table" and _.nominal ~= nil then _.nominal(_, "blockModel") else TTypeMacros.nominal(_, "blockModel")

_object[_left] = if type(_1) == "table" and _1.as ~= nil then _1.as(_1) else TTypeMacros.as(_1)
_object.color = t.color
_object.data = BlockLogicTypes.T.fromBlockConfigDefinition(definition.input.data.types)

local updateEventType = t.interface(_object)

----------------------------------------------------------------
-- Data formatting
----------------------------------------------------------------

local dataToString

dataToString = function(data)
	if type(data) == "string" then
		return data
	end

	if typeof(data) == "Vector3" then
		return `{dataToString(data.X)}x\n{dataToString(data.Y)}y\n{dataToString(data.Z)}z`
	end

	if typeof(data) == "Color3" then
		return `{dataToString(data.R)}r\n{dataToString(data.G)}g\n{dataToString(data.B)}b`
	end

	if type(data) == "number" then
		if data % 0.001 ~= 0 then
			return `{Strings.prettyNumber(data, 0.001)}..`
		end
	end

	if type(data) == "table" and data.id ~= nil then
		local count = data.effects and #data.effects or 0
		return `Sound {data.id}\n[{count} effects]`
	end

	return tostring(data)
end

----------------------------------------------------------------
-- Update logic (SAFE)
----------------------------------------------------------------

local update = function(_param)
	local block = _param.block
	local color = _param.color
	local data = _param.data

	local part = block:FindFirstChild("Part")
	if not part then return end

	local gui = part:FindFirstChild("SurfaceGui")
	if not gui then return end

	local label = gui:FindFirstChild("TextLabel")
	if not label then return end

	label.Text = dataToString(data)
	label.TextColor3 = color
end

local events = {
	update = BlockSynchronizer.new("b_unscaled_screen_update", updateEventType, update),
}

events.update.sendBackToOwner = true

----------------------------------------------------------------
-- Logic class
----------------------------------------------------------------

local Logic

do
	local super = InstanceBlockLogic

	Logic = setmetatable({}, {
		__tostring = function() return "Logic" end,
		__index = super,
	})

	Logic.__index = Logic

	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block)
		super.constructor(self, definition, block)

		self:on(function(_param)
			events.update:sendOrBurn({
				block = self.instance,
				color = _param.textColor,
				data = _param.data,
			}, self)
		end)
	end

	Logic.dataToString = dataToString
	Logic.defaultPixelDensity = 80
end

----------------------------------------------------------------
-- Immediate creation (UNSCALED)
----------------------------------------------------------------

local immediate = BlockCreation.immediate(definition, function(block, config)
	Instances.waitForChild(block, "Part", "SurfaceGui", "TextLabel")

	-- ✅ Fixed pixel density (no scaling behavior)
	block.Part.SurfaceGui.PixelsPerStud = Logic.defaultPixelDensity

	events.update:send({
		block = block,
		color = BlockCreation.defaultIfWiredUnset(
			config and config.textColor,
			Color3.new(1, 1, 1)
		),
		data = BlockCreation.defaultIfWiredUnset(
			config and config.data,
			"UnscaledScreen"
		),
	})
end)

----------------------------------------------------------------
-- Block registration
----------------------------------------------------------------

local _object_2 = table.clone(BlockCreation.defaults)
setmetatable(_object_2, nil)

_object_2.id = "unscaledscreen"
_object_2.displayName = "Unscaled Screen"
_object_2.description = "Display all your data for everyone to see (no auto-rescale)!"

_object_2.logic = {
	definition = definition,
	ctor = Logic,
	events = events,
	immediate = immediate,
}

_object_2.search = {
	partialAliases = { "display", "screen" },
}

return {
	dataToString = dataToString,
	UnscaledScreenBlockLogic = Logic,
	UnscaledScreenBlock = _object_2,
}