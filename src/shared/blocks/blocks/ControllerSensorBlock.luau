-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ComponentEvents2Macros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "component", "ComponentEvents.propmacro").ComponentEvents2Macros
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local RunService = _services.RunService
local UserInputService = _services.UserInputService
local BlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").BlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation

local definition = {
	outputOrder = { 
		"leftStick", 
		"rightStick", 
		"leftTrigger", 
		"rightTrigger",
		"leftStickButton",
		"rightStickButton",
	},
	input = {},
	output = {
		leftStick = {
			displayName = "Left Stick Position",
			unit = "Vector3 (x, y, z)",
			types = { "vector3" },
		},
		rightStick = {
			displayName = "Right Stick Position",
			unit = "Vector3 (x, y, z)",
			types = { "vector3" },
		},
		leftTrigger = {
			displayName = "Left Trigger Depth",
			unit = "Depth (0 to 1)",
			types = { "number" },  -- Now it's a number instead of Vector3
		},
		rightTrigger = {
			displayName = "Right Trigger Depth",
			unit = "Depth (0 to 1)",
			types = { "number" },  -- Now it's a number instead of Vector3
		},
		leftStickButton = {
			displayName = "Left Stick Button",
			unit = "Pressed (0 or 1)",
			types = { "number" },
		},

		rightStickButton = {
			displayName = "Right Stick Button",
			unit = "Pressed (0 or 1)",
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
		__csymbol = "shared/blocks/blocks/ControllerSensorBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic
	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block)
		super.constructor(self, definition, block)

		-- Initialize variables for controller input
		local leftStick = Vector3.new(0, 0, 0)  -- x, y position of the left thumbstick
		local rightStick = Vector3.new(0, 0, 0)  -- x, y position of the right thumbstick
		local leftTrigger = 0  -- 0 to 1 value for left trigger depth
		local rightTrigger = 0  -- 0 to 1 value for right trigger depth
		local leftStickButton = 0
		local rightStickButton = 0

		if RunService:IsClient() then
			local _event = self.event
			local _inputChanged = UserInputService.InputChanged
			local event = _event

			local _inputHandler = function(input, gameProcessedEvent)
				-- Ignore inputs that were already processed (like UI inputs)
				if gameProcessedEvent then return end

				if input.UserInputType == Enum.UserInputType.Gamepad1 then
					if input.KeyCode == Enum.KeyCode.Thumbstick1 then
						-- Left Stick: x, y position
						leftStick = Vector3.new(input.Position.X, input.Position.Y, 0)
					elseif input.KeyCode == Enum.KeyCode.Thumbstick2 then
						-- Right Stick: x, y position
						rightStick = Vector3.new(input.Position.X, input.Position.Y, 0)
					end

					-- Left Trigger Depth (as a number between 0 and 1)
					if input.KeyCode == Enum.KeyCode.ButtonL2 then
						leftTrigger = input.Position.Z  -- Depth value from 0 to 1
					end

					-- Right Trigger Depth (as a number between 0 and 1)
					if input.KeyCode == Enum.KeyCode.ButtonR2 then
						rightTrigger = input.Position.Z  -- Depth value from 0 to 1
					end
				end
			end
			local _2 = if type(event) == "table" and event.subscribe ~= nil then event.subscribe(event, _inputChanged, _inputHandler) else ComponentEvents2Macros.subscribe(event, _inputChanged, _inputHandler)
		end

		-- PostSimulation to update outputs
		local _event = self.event
		local _postSimulation = RunService.PostSimulation
		local event = _event
		local _1 = function()
			if RunService:IsClient() then
				local gamepadState = UserInputService:GetGamepadState(Enum.UserInputType.Gamepad1)

				-- Reset each frame
				leftStickButton = 0
				rightStickButton = 0

				for event, input in ipairs(gamepadState) do
					if input.KeyCode == Enum.KeyCode.Thumbstick1 then
						leftStick = Vector3.new(input.Position.X, input.Position.Y, 0)

					elseif input.KeyCode == Enum.KeyCode.Thumbstick2 then
						rightStick = Vector3.new(input.Position.X, input.Position.Y, 0)

					elseif input.KeyCode == Enum.KeyCode.ButtonL2 then
						leftTrigger = input.Position.Z

					elseif input.KeyCode == Enum.KeyCode.ButtonR2 then
						rightTrigger = input.Position.Z

					elseif input.KeyCode == Enum.KeyCode.ButtonL3 then
						if input.UserInputState == Enum.UserInputState.Begin 
							or input.UserInputState == Enum.UserInputState.Change then
							leftStickButton = 1
						end

					elseif input.KeyCode == Enum.KeyCode.ButtonR3 then
						if input.UserInputState == Enum.UserInputState.Begin 
							or input.UserInputState == Enum.UserInputState.Change then
							rightStickButton = 1
						end
					end
				end
			end

			self.output.leftStick:set("vector3", leftStick)
			self.output.rightStick:set("vector3", rightStick)
			self.output.leftTrigger:set("number", leftTrigger)
			self.output.rightTrigger:set("number", rightTrigger)
			self.output.leftStickButton:set("number", leftStickButton)
			self.output.rightStickButton:set("number", rightStickButton)
		end
		local _2 = if type(event) == "table" and event.subscribe ~= nil then event.subscribe(event, _postSimulation, _1) else ComponentEvents2Macros.subscribe(event, _postSimulation, _1)
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "controllersensor"
_object.displayName = "Controller Sensor"
_object.description = "Tracks controller stick positions and trigger depths"
_object.logic = {
	definition = definition,
	ctor = Logic,
}

local ControllerSensorBlock = _object
return {
	ControllerSensorBlockLogic = Logic,
	ControllerSensorBlock = ControllerSensorBlock,
}