-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local TTypeMacros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "t.propmacro").TTypeMacros
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

-- input definition
local LEG_TARGETS = {
	leftUpper  = "leftUpper",
	lowerLeft  = "leftLower",
	upperRight = "rightUpper",
	lowerRight = "rightLower",
}

local definition = {
	input = {
		attachToLeg = {
			displayName = "Attach To",
			tooltip = "Which leg to attach the block to",
			types = {
				enum = {
					config = "leftUpper",
					elementOrder = {"leftUpper","lowerLeft","upperRight","lowerRight"},
					elements = LEG_TARGETS,
				},
			},
			connectorHidden = true,
		},

		detachKey = {
			displayName = "Attach/Detach",
			tooltip = "Attach or detach the Leg mount",
			types = {
				key = { config = "H" },
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

local MAX_PROMPT_VISIBILITY_DISTANCE = 5
local MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED = 15
local owners = {}
local Logic

-- update weld function
local updateWeld = function(caller, owner, block, attachTo)
	local weldOwner = owners[block]

	local currentlyWelded = weldOwner ~= nil

	if currentlyWelded and weldOwner == caller then
		-- Detach
		owners[block] = nil
	else
		-- Attach
		owners[block] = caller
	end

	Logic.events.weldMountUpdate:send({
		block = block,
		weldedState = not currentlyWelded,
		owner = owner,
		attachTo = attachTo, -- pass selected leg part
	})
end


-- helper to get Leg part

-- owner-side initialization
local function ownerSideInit(param, pp)
	local block = param.block
	local key = param.key
	local attachTo = param.attachTo
	local owner = param.owner
	local player = Players.LocalPlayer
	local mainPart = block:FindFirstChild("mainPart")
	if not mainPart then return end

	local k = Enum.KeyCode[key]
	if k == Enum.KeyCode.Unknown then return end

	local handler = EventHandler.new()
	handler:subscribe(block.DescendantRemoving, function()
		return handler:unsubscribeAll()
	end)
	handler:subscribe(pp.Triggered, function()
		return updateWeld(player, owner, block, attachTo)
	end)
	handler:subscribe(UserInputService.InputBegan, function(input, gameProcessed)
		if gameProcessed then return end
		if input.KeyCode == k then
			updateWeld(player, owner, block, attachTo)
		end
	end)
	handler:subscribe(RunService.Heartbeat, function()
		local weldOwner = owners[block]
		if weldOwner ~= player then return end
		local camera = Workspace.CurrentCamera
		if not camera then return end
		local distance = (camera.CFrame.Position - mainPart.Position).Magnitude
		pp.MaxActivationDistance = if distance > MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED then 0 else distance
	end)
end

-- update proximity prompt
local function updateProximity(data)
	local block = data.block
	local pp = block:FindFirstChild("ProximityPrompt")
	if not pp then return end
	local k = Enum.KeyCode[data.key]
	if k ~= Enum.KeyCode.Unknown then
		pp.KeyboardKeyCode = k
		pp.GamepadKeyCode = k
	else
		pp.Enabled = false
	end
	if data.owner == Players.LocalPlayer then
		pp.Enabled = true
		pp.MaxActivationDistance = MAX_PROMPT_VISIBILITY_DISTANCE
		ownerSideInit(data, pp)
	else
		pp.Enabled = data.isPublic
		pp.MaxActivationDistance = if data.isPublic then MAX_PROMPT_VISIBILITY_DISTANCE else 0
	end
end

-- LegMount Logic class
do
	local super = InstanceBlockLogic
	Logic = setmetatable({}, {
		__tostring = function() return "Logic" end,
		__csymbol = "shared/blocks/blocks/LegMountBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic
	function Logic.new(...) local self = setmetatable({}, Logic); return self:constructor(...) or self end
	function Logic:constructor(block)
		super.constructor(self, definition, block)
		self:onk({ "detachKey", "attachToLeg" }, function(param)
			Logic.events.updateProximity:send({
				block = self.instance,
				key = param.detachKey,
				owner = Players.LocalPlayer,
				attachTo = param.attachToLeg,
				isPublic = false,
			})
		end)
	end
	Logic.events = {
		updateProximity = BlockSynchronizer.new("legmount_proximity", t.interface({
			block = TTypeMacros.as(TTypeMacros.nominal(t.instance("Model"), "blockModel")),
			owner = t.any,
			isPublic = t.boolean,
			key = t.string,
			attachTo = t.string,
		}), updateProximity),
		weldMountUpdate = A2SRemoteEvent.new("legmount_weld", "RemoteEvent"),
		updateLogic = S2CRemoteEvent.new("legmount_logic", "RemoteEvent"),
	}
end

-- handle updates from server
Logic.events.updateLogic.invoked:Connect(function(param)
	local block = param.block
	local weldedTo = param.weldedTo
	owners[block] = weldedTo
	local pp = block:FindFirstChild("ProximityPrompt")
	if pp then
		pp.ActionText = if weldedTo then "Detach" else "Attach"
		pp.MaxActivationDistance = if not weldedTo then MAX_PROMPT_VISIBILITY_DISTANCE else 0
	end
end)

-- block creation
local _object_1 = table.clone(BlockCreation.defaults)
setmetatable(_object_1, nil)
_object_1.id = "legmount"
_object_1.displayName = "Leg Mount"
_object_1.description = "A mountable block you can attach to legs (upper/lower)."
_object_1.limit = 999999999999999
_object_1.logic = { definition = definition, ctor = Logic }

local LegMountBlock = _object_1
return {
	LegMountBlockLogic = Logic,
	LegMountBlock = LegMountBlock,
}
