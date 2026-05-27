-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local TTypeMacros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t.propmacro").TTypeMacros
local ComponentEvents2Macros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "component", "ComponentEvents.propmacro").ComponentEvents2Macros
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local RunService = _services.RunService
local UserInputService = _services.UserInputService
local Workspace = _services.Workspace
local EventHandler = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "event", "EventHandler").EventHandler
local _PERemoteEvent = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "event", "PERemoteEvent")
local A2SRemoteEvent = _PERemoteEvent.A2SRemoteEvent
local S2CRemoteEvent = _PERemoteEvent.S2CRemoteEvent
local t = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t").t
local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockSynchronizer = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockSynchronizer").BlockSynchronizer
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
-- change to headmount
local definition = {
	input = {
		detachKey = {
			displayName = "Attach/Detach",
			tooltip = "Attach or detach the head mount.",
			types = {
				key = {
					config = "H",
				},
			},
			connectorHidden = true,
		},
		detachBool = {
			displayName = "Attach/Detach",
			tooltip = "Attach or detach the head mount.",
			types = {
				bool = {
					config = false,
				},
			},
			configHidden = true,
		},
		shared = {
			displayName = "Shared",
			tooltip = "Allows other players to wear your head mount. It doesn't work as it used to.",
			types = {
				bool = {
					config = false,
				},
			},
			connectorHidden = true,
		},
	},
	output = {
		mounted = {
			displayName = "Occupied",
			tooltip = "Returns true if player is mounted",
			types = { "bool" },
		},
	},
}
-- declaring constants here
local MAX_PROMPT_VISIBILITY_DISTANCE = 5
local MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED = 15
local owners = {}
local Logic
local updateWeld = function(caller, owner, block)
	local _block = block
	local weldOwner = owners[_block]
	if weldOwner == nil then
		Logic.events.weldMountUpdate:send({
			block = block,
			weldedState = true,
			owner = owner,
			attachTo = "Head", -- explicit for future server logic
		})
		return nil
	end
	if weldOwner == caller then
		Logic.events.weldMountUpdate:send({
			block = block,
			weldedState = false,
			owner = owner,
			attachTo = "Head", -- explicit for future server logic
		})

		return nil
	end
	return
end
local ownerSideInit = function(_param, pp)
	local block = _param.block
	local key = _param.key
	local owner = _param.owner
	-- set activation key
	local k = Enum.KeyCode[key]
	local isUnknownKeybind = k == Enum.KeyCode.Unknown
	local player = Players.LocalPlayer
	local mainPart = block:FindFirstChild("mainPart")
	if not mainPart then
		return nil
	end
	-- remote client event handler
	local handler = EventHandler.new()
	-- subscribe to block being destroyed
	handler:subscribe(block.DescendantRemoving, function()
		return handler:unsubscribeAll()
	end)
	handler:subscribe(pp.Triggered, function()
		return updateWeld(player, owner, block)
	end)
	-- subscribe to keypress
	handler:subscribe(UserInputService.InputBegan, function(input, gameProccessed)
		if gameProccessed then
			return nil
		end
		if isUnknownKeybind then
			return nil
		end
		if input.KeyCode ~= k then
			return nil
		end
		updateWeld(player, owner, block)
		return
	end)
	-- some checks so the prompt disappears when player wearing
	handler:subscribe(RunService.Heartbeat, function()
		local weldOwner = owners[block]
		if weldOwner ~= player then
			return nil
		end
		local camera = Workspace.CurrentCamera
		if not camera then
			return nil
		end
		local _position = camera.CFrame.Position
		local _position_1 = mainPart.Position
		local distance = (_position - _position_1).Magnitude
		pp.MaxActivationDistance = if distance > MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED then 0 else distance
		return
	end)
	return
end
local otherClientSideInit = function(_param, pp)
	local block = _param.block
	local key = _param.key
	local isPublic = _param.isPublic
	local owner = _param.owner
	-- set activation key
	local k = Enum.KeyCode[key]
	local isUnknownKeybind = k == Enum.KeyCode.Unknown
	local player = Players.LocalPlayer
	local mainPart = block:FindFirstChild("mainPart")
	if not mainPart then
		return nil
	end
	-- remote client event handler
	local handler = EventHandler.new()
	-- subscribe to block being destroyed
	handler:subscribe(block.DescendantRemoving, function()
		return handler:unsubscribeAll()
	end)
	handler:subscribe(pp.Triggered, function()
		updateWeld(player, owner, block)
	end)
	-- subscribe to keypress
	handler:subscribe(UserInputService.InputBegan, function(input, gameProccessed)
		if gameProccessed then
			return nil
		end
		if isUnknownKeybind then
			return nil
		end
		if input.KeyCode ~= k then
			return nil
		end
		-- make it only available to unweld on the same key
		if owners[block] ~= player then
			return nil
		end
		updateWeld(player, owner, block)
		return
	end)
	-- some checks so the prompt disappears when player wearing
	handler:subscribe(RunService.Heartbeat, function()
		if not isPublic then
			return nil
		end
		local weldOwner = owners[block]
		-- these two checks are placed here ON PURPOSE
		-- allows the owner of the block to unequip the block off other players
		if weldOwner == nil then
			pp.MaxActivationDistance = MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED
			return nil
		end
		if weldOwner ~= player then
			pp.MaxActivationDistance = 0
			return nil
		end
		local camera = Workspace.CurrentCamera
		if not camera then
			return nil
		end
		local _position = camera.CFrame.Position
		local _position_1 = mainPart.Position
		local distance = (_position - _position_1).Magnitude
		pp.MaxActivationDistance = if distance > MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED then 0 else distance
		return
	end)
	return
end
local updateProximity = function(data)
	local block = data.block
	local key = data.key
	local pp = block:FindFirstChild("ProximityPrompt")
	if not pp then
		return nil
	end
	-- set activation key
	local k = Enum.KeyCode[key]
	local isUnknownKeybind = k == Enum.KeyCode.Unknown
	block.DescendantRemoving:Connect(function()
		-- ▼ Map.delete ▼
		local _valueExisted = owners[block] ~= nil
		owners[block] = nil
		-- ▲ Map.delete ▲
		return _valueExisted
	end)
	if not isUnknownKeybind then
		pp.KeyboardKeyCode = k
		pp.GamepadKeyCode = k
	else
		pp.Enabled = false
	end
	if data.owner == Players.LocalPlayer then
		pp.Enabled = true
		pp.MaxActivationDistance = MAX_PROMPT_VISIBILITY_DISTANCE
		ownerSideInit(data, pp)
		return
	else
		pp.Enabled = data.isPublic
		pp.MaxActivationDistance = if data.isPublic then MAX_PROMPT_VISIBILITY_DISTANCE else 0
		otherClientSideInit(data, pp)
		return
	end
end
local _object = {}
local _left = "block"
local event = t.instance("Model")
local _1 = if type(event) == "table" and event.nominal ~= nil then event.nominal(event, "blockModel") else TTypeMacros.nominal(event, "blockModel")
_object[_left] = if type(_1) == "table" and _1.as ~= nil then _1.as(_1) else TTypeMacros.as(_1)
local _left_1 = "owner"
local _any = t.any
_object[_left_1] = if type(_any) == "table" and _any.as ~= nil then _any.as(_any) else TTypeMacros.as(_any)
_object.isPublic = t.boolean
_object.key = t.string
local proximityEventType = t.interface({
	block = TTypeMacros.as(TTypeMacros.nominal(t.instance("Model"), "blockModel")),
	owner = t.any,
	isPublic = t.boolean,
	key = t.string,
})

do
	local super = InstanceBlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/HeadMountBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic
	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end
	function Logic:constructor(block)
		super.constructor(self, definition, block)
		-- update pressable key
		self:onk({ "detachKey", "shared" }, function(_param)
			local detachKey = _param.detachKey
			local shared = _param.shared
			Logic.events.updateProximity:send({
				block = self.instance,
				key = detachKey,
				isPublic = shared,
				owner = Players.LocalPlayer,
			})

		end)
		-- call weld stuff on detach bool
		self:onk({ "detachBool" }, function(_param)
			local detachBoolChanged = _param.detachBoolChanged
			local detachBool = _param.detachBool
			if not detachBoolChanged then
				return nil
			end
			Logic.events.weldMountUpdate:send({
				block = self.instance,
				weldedState = detachBool,
				owner = Players.LocalPlayer,
				attachTo = "Head",
			})
			return
		end)
		if RunService:IsClient() then
			local _event = self.event
			local _invoked = Logic.events.updateLogic.invoked
			local _2 = _event
			local _3 = function(_param)
				local block = _param.block
				local weldedTo = _param.weldedTo
				if block ~= self.instance then
					return nil
				end
				self.output.mounted:set("bool", not not weldedTo)
				return
			end
			local _4 = if type(_2) == "table" and _2.subscribe ~= nil then _2.subscribe(_2, _invoked, _3) else ComponentEvents2Macros.subscribe(_2, _invoked, _3)
		end
	end
	Logic.events = {
		updateLogic = S2CRemoteEvent.new("headmount_logic", "RemoteEvent"),
		weldMountUpdate = A2SRemoteEvent.new("headmount_weld", "RemoteEvent"),
		updateProximity = BlockSynchronizer.new("headmount_proximity", proximityEventType, updateProximity),
	}
end
-- add handler to make it constantly fill the map
Logic.events.updateLogic.invoked:Connect(function(_param)
	local block = _param.block
	local weldedTo = _param.weldedTo
	owners[block] = weldedTo
	local pp = block:FindFirstChild("ProximityPrompt")
	if not pp then
		return nil
	end
	pp.ActionText = if weldedTo then "Detach" else "Attach"
	pp.MaxActivationDistance = if not weldedTo then MAX_PROMPT_VISIBILITY_DISTANCE else 0
	return
end)
local _object_1 = table.clone(BlockCreation.defaults)
setmetatable(_object_1, nil)
_object_1.id = "headmount"
_object_1.displayName = "Head Mount"
_object_1.description = "A mountable helmet. You can weld stuff to it and wear it."
_object_1.limit = 999999999999999
_object_1.search = {
	partialAliases = { "head", "helmet", "hat", "accessory" },
}
_object_1.logic = {
	definition = definition,
	ctor = Logic,
}
local HeadMountBlock = _object_1
return {
	HeadMountBlockLogic = Logic,
	HeadMountBlock = HeadMountBlock,
}
