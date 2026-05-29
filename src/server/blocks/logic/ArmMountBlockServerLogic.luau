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

-- ArmMount server logic
local ArmMountBlockServerLogic
do
	local super = ServerBlockLogic
	ArmMountBlockServerLogic = setmetatable({}, {
		__tostring = function()
			return "ArmMountBlockServerLogic"
		end,
		__csymbol = "server/blocks/logic/ArmMountBlockServerLogic.ts$ArmMountBlockServerLogic",
		__index = super,
	})
	ArmMountBlockServerLogic.__index = ArmMountBlockServerLogic

	function ArmMountBlockServerLogic.new(...)
		local self = setmetatable({}, ArmMountBlockServerLogic)
		return self:constructor(...) or self
	end

	-- maps the attachTo string to the correct arm part
	local function getPlayerArm(player, attachTo)
		local character = player.Character
		if not character then return nil end

		-- R15 mapping
		local R15_ARMS = {
			leftUpper  = "LeftUpperArm",
			lowerLeft  = "LeftLowerArm",
			upperRight = "RightUpperArm",
			lowerRight = "RightLowerArm",
		}

		-- R6 mapping
		local R6_ARMS = {
			leftUpper  = "Left Arm",
			lowerLeft  = "Left Arm",
			upperRight = "Right Arm",
			lowerRight = "Right Arm",
		}

		if character:FindFirstChild("Humanoid") and character.Humanoid.RigType == Enum.HumanoidRigType.R15 then
			return character:FindFirstChild(R15_ARMS[attachTo])
		else
			return character:FindFirstChild(R6_ARMS[attachTo])
		end
	end

	function ArmMountBlockServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)

		-- you can tweak offsets per arm here
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
				local armPart = getPlayerArm(player, data.attachTo)
				if not armPart then return nil end

				-- apply offset
				local offset = OFFSET_TABLE[data.attachTo] or CFrame.new(0,0,0)
				weld.C0 = offset
				weld.Part1 = armPart

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

	function ArmMountBlockServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(
			logic,
			di:resolve("server/modes/PlayModeController.ts$PlayModeController")
		)
	end
end

return {
	ArmMountBlockServerLogic = ArmMountBlockServerLogic,
}
