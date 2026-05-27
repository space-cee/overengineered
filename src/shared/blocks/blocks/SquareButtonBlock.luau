local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local TTypeMacros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t.propmacro").TTypeMacros
local ComponentEvents2Macros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "component", "ComponentEvents.propmacro").ComponentEvents2Macros
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local RunService = _services.RunService
local EventHandler = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "event", "EventHandler").EventHandler
local A2OCRemoteEvent = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "event", "PERemoteEvent").A2OCRemoteEvent
local Instances = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "fixes", "Instances").Instances
local t = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t").t
local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockSynchronizer = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockSynchronizer").BlockSynchronizer
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation

local definition = {
	inputOrder = { "text", "switchMode", "sharedMode", "lampColor", "buttonColor" },
	input = {
		text = {
			displayName = "Text",
			tooltip = "Text on the button.",
			types = {
				string = {
					config = "CLICK ME!",
				},
			},
			connectorHidden = true,
		},
		sharedMode = {
			displayName = "Shared",
			tooltip = "Allows other players to press the button if enabled.",
			types = {
				bool = {
					config = false,
				},
			},
			connectorHidden = true,
		},
		switchMode = {
			displayName = "Switch Mode",
			tooltip = "Button will act as a switch if enabled.",
			types = {
				bool = {
					config = false,
				},
			},
			connectorHidden = true,
		},
		buttonColor = {
			displayName = "Button Color",
			types = {
				color = {
					config = Color3.fromRGB(196, 40, 28),
				},
			},
			connectorHidden = true,
		},
		lampColor = {
			displayName = "Lamp Color",
			types = {
				color = {
					config = Color3.fromRGB(0xff, 0xff, 0xff),
				},
			},
		},
	},
	output = {
		result = {
			displayName = "Pressed",
			types = { "bool" },
		},
	},
}

local baseLEDColor = Color3.fromRGB(17, 17, 17)

local _object = {}
local _left = "block"
local _ = t.instance("Model")
_object[_left] = if type(_) == "table" and _.as ~= nil then _.as(_) else TTypeMacros.as(_)
_object.buttonColor = t.color
_object.text = t.string
local updateTextDataType = t.interface(_object)

local _object_1 = {}
local _left_1 = "block"
local _1 = t.instance("Model")
_object_1[_left_1] = if type(_1) == "table" and _1.as ~= nil then _1.as(_1) else TTypeMacros.as(_1)
_object_1.LEDcolor = t.color
_object_1.buttonState = t.boolean
local updateStateDataType = t.interface(_object_1)

local _object_2 = {}
local _left_2 = "block"
local _2 = t.instance("Model")
_object_2[_left_2] = if type(_2) == "table" and _2.as ~= nil then _2.as(_2) else TTypeMacros.as(_2)
_object_2.owner = t.instance("Player")
local initButtonType = t.interface(_object_2)

local updateButtonText = function(_param)
	local block = _param.block
	local buttonColor = _param.buttonColor
	local text = _param.text
	block.Button.SurfaceGui.TextLabel.Text = text
	block.Button.Color = buttonColor
end

local updateButtonState = function(_param)
	local block = _param.block
	local LEDcolor = _param.LEDcolor
	local buttonState = _param.buttonState
	block.LED.Color = if buttonState then LEDcolor else baseLEDColor
	block.Base.AlignPosition.Attachment1 = if buttonState then block.Base.PressedPosition else block.Base.DepressedPosition
end

local clickEvent

local init = function(_param)
	local block = _param.block
	local owner = _param.owner
	local handler = EventHandler.new()
	block.Base.ClickDetector.MaxActivationDistance = math.huge
	local onClickEvent = function()
		return clickEvent:send(owner, block)
	end
	handler:subscribe(block.Base.ClickDetector.MouseClick, onClickEvent)
	handler:subscribe(block.DescendantRemoving, function()
		return handler:unsubscribeAll()
	end)
end

local events = {
	updateText = BlockSynchronizer.new("b_squarebutton_data_update_text", updateTextDataType, updateButtonText),
	updateState = BlockSynchronizer.new("b_squarebutton_data_update_state", updateStateDataType, updateButtonState),
	init = BlockSynchronizer.new("b_squarebutton_init", initButtonType, init),
}

events.updateText.sendBackToOwner = true
clickEvent = A2OCRemoteEvent.new("b_squarebutton_click", "RemoteEvent")

local Logic
do
	local super = InstanceBlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/SquareButtonBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic

	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block, playerDataStorage)
		super.constructor(self, definition, block)
		local inst = self.instance
		if not inst then
			return nil
		end

		local button = inst.Button
		local led = inst.LED

		local cachedLEDColor = self:initializeInputCache("lampColor")
		local cachedSwitchMode = self:initializeInputCache("switchMode")
		local cachedSharedMode = self:initializeInputCache("sharedMode")

		local UpdateOnNextTick = false
		local isPressed = false

		local upd = function()
			events.updateState:sendOrBurn({
				block = inst,
				buttonState = isPressed,
				LEDcolor = cachedLEDColor.get(),
			}, self)
		end

		local pressButton = function(playerWhoClicked)
			if not cachedSharedMode.get() and Players.LocalPlayer ~= playerWhoClicked then
				return nil
			end

			local isSwitch = cachedSwitchMode.get()

			if isSwitch then
				local _result = self.output.result
				isPressed = not isPressed
				_result:set("bool", isPressed)
				upd()
				return nil
			end

			local _result = self.output.result
			isPressed = true
			_result:set("bool", isPressed)

			local _result_1 = playerDataStorage
			if _result_1 ~= nil then
				_result_1 = _result_1.config:get().graphics.logicEffects
			end

			local triggerLamp = _result_1 == true

			if triggerLamp then
				led.Color = cachedLEDColor.get()
				upd()
			end

			UpdateOnNextTick = true
		end

		if RunService:IsClient() then
			local _event = self.event
			local _invoked = clickEvent.invoked
			local _3 = _event
			local _4 = function(block, whoPressed)
				if self.instance ~= block then
					return nil
				end
				if not whoPressed then
					return nil
				end
				pressButton(whoPressed)
			end
			local _5 = if type(_3) == "table" and _3.subscribe ~= nil then _3.subscribe(_3, _invoked, _4) else ComponentEvents2Macros.subscribe(_3, _invoked, _4)
		end

		self:onEnable(function()
			return self.output.result:set("bool", false)
		end)

		self:onk({ "sharedMode" }, function(_param)
			local sharedMode = _param.sharedMode
			if not sharedMode then
				init({
					block = inst,
					owner = Players.LocalPlayer,
				})
			else
				events.init:sendOrBurn({
					block = inst,
					owner = Players.LocalPlayer,
				}, self)
			end
		end)

		self:onk({ "buttonColor", "text" }, function(_param)
			local buttonColor = _param.buttonColor
			local text = _param.text
			button.Color = buttonColor
			button.SurfaceGui.TextLabel.Text = text
			events.updateText:sendOrBurn({
				block = inst,
				text = button.SurfaceGui.TextLabel.Text,
				buttonColor = buttonColor,
			}, self)
		end)

		self:onAlwaysInputs(function(_param)
			local switchMode = _param.switchMode
			if UpdateOnNextTick then
				UpdateOnNextTick = false
				return UpdateOnNextTick
			end
			if not switchMode and isPressed then
				local _result = self.output.result
				isPressed = false
				_result:set("bool", isPressed)
				upd()
			end
		end)
	end

	function Logic:_depsCreate(_____instance, di, block)
		return _____instance:constructor(block, di:tryResolve("client/PlayerDataStorage.ts$PlayerDataStorage"))
	end
end

local immediate = BlockCreation.immediate(definition, function(block, config)
	local btn = Instances.waitForChild(block, "Button")
	Instances.waitForChild(btn, "SurfaceGui", "TextLabel")

	local _updateText = events.updateText
	local _object_3 = {
		block = block,
	}

	local _left_3 = "buttonColor"
	local _result = config
	if _result ~= nil then
		_result = _result.buttonColor
	end
	_object_3[_left_3] = BlockCreation.defaultIfWiredUnset(_result, definition.input.buttonColor.types.color.config)

	local _left_4 = "text"
	local _result_1 = config
	if _result_1 ~= nil then
		_result_1 = _result_1.text
	end
	_object_3[_left_4] = BlockCreation.defaultIfWiredUnset(_result_1, definition.input.text.types.string.config)

	_updateText:send(_object_3)
end)

local _object_3 = table.clone(BlockCreation.defaults)
setmetatable(_object_3, nil)

_object_3.id = "squarebutton"
_object_3.displayName = "Square Button"
_object_3.description = "Returns true when the square button is clicked or tapped. Can be activated by other players if configured."
_object_3.logic = {
	definition = definition,
	ctor = Logic,
	events = events,
	immediate = immediate,
}

local SquareButtonBlock = _object_3

return {
	SquareButtonBlockLogic = Logic,
	SquareButtonBlock = SquareButtonBlock,
}