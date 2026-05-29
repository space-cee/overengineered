-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ServerBlockLogic = TS.import(
	script,
	game:GetService("ServerScriptService"),
	"TS",
	"blocks",
	"ServerBlockLogic"
).ServerBlockLogic

local ServerPartUtils = TS.import(
	script,
	game:GetService("ServerScriptService"),
	"TS",
	"plots",
	"ServerPartUtils"
).ServerPartUtils

-- LegMount server logic
local LegMountBlockServerLogic
do
	local super = ServerBlockLogic
	LegMountBlockServerLogic = setmetatable({}, {
		__tostring = function()
			return "LegMountBlockServerLogic"
		end,
		__csymbol = "server/blocks/logic/LegMountBlockServerLogic.ts$LegMountBlockServerLogic",
		__index = super,
	})
	LegMountBlockServerLogic.__index = LegMountBlockServerLogic

	function LegMountBlockServerLogic.new(...)
		local self = setmetatable({}, LegMountBlockServerLogic)
		return self:constructor(...) or self
	end

	-- maps the attachTo string to the correct leg part
	local function getPlayerLeg(player, attachTo)
		local character = player.Character
		if not character then return nil end

		-- R15 mapping
		local R15_LEGS = {
			leftUpper  = "LeftUpperLeg",
			lowerLeft  = "LeftLowerLeg",
			upperRight = "RightUpperLeg",
			lowerRight = "RightLowerLeg",
		}

		-- R6 mapping
		local R6_LEGS = {
			leftUpper  = "Left Leg",
			lowerLeft  = "Left Leg",
			upperRight = "Right Leg",
			lowerRight = "Right Leg",
		}

		local humanoid = character:FindFirstChild("Humanoid")
		if humanoid and humanoid.RigType == Enum.HumanoidRigType.R15 then
			return character:FindFirstChild(R15_LEGS[attachTo])
		else
			return character:FindFirstChild(R6_LEGS[attachTo])
		end
	end

	function LegMountBlockServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)

		-- you can tweak offsets per leg here
		local OFFSET_TABLE = {
			leftUpper  = CFrame.new(0, 0, -0.5),
			lowerLeft  = CFrame.new(0, 0, -0.5),
			upperRight = CFrame.new(0, 0, -0.5),
			lowerRight = CFrame.new(0, 0, -0.5),
		}

		logic.events.weldMountUpdate.invoked:Connect(function(player, data)
			if not player then return nil end

			local weld = data.block.PlayerWeldConstraint
			if not weld then return nil end

			local isWeldRequest = data.weldedState and weld.Part1 == nil

			if isWeldRequest then
				local legPart = getPlayerLeg(player, data.attachTo)
				if not legPart then return nil end

				-- apply offset
				local offset = OFFSET_TABLE[data.attachTo] or CFrame.new(0, 0, 0)
				weld.C0 = offset
				weld.Part1 = legPart

				ServerPartUtils.switchDescendantsNetworkOwner(data.block, player)

				logic.events.updateLogic:send("everyone", {
					block = data.block,
					weldedTo = player,
				})
				return nil
			end

			-- detach
			weld.Part1 = nil
			ServerPartUtils.switchDescendantsNetworkOwner(data.block, data.owner)

			logic.events.updateLogic:send("everyone", {
				block = data.block,
				weldedTo = nil,
			})
			return
		end)
	end

	function LegMountBlockServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(
			logic,
			di:resolve("server/modes/PlayModeController.ts$PlayModeController")
		)
	end
end

return {
	LegMountBlockServerLogic = LegMountBlockServerLogic,
}
