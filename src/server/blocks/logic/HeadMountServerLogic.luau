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

-- HeadMount server logic
local HeadMountBlockServerLogic
do
	local super = ServerBlockLogic
	HeadMountBlockServerLogic = setmetatable({}, {
		__tostring = function()
			return "HeadMountBlockServerLogic"
		end,
		__csymbol = "server/blocks/logic/HeadMountBlockServerLogic.ts$HeadMountBlockServerLogic",
		__index = super,
	})
	HeadMountBlockServerLogic.__index = HeadMountBlockServerLogic

	function HeadMountBlockServerLogic.new(...)
		local self = setmetatable({}, HeadMountBlockServerLogic)
		return self:constructor(...) or self
	end

	function HeadMountBlockServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)

		-- R6 & R15 compatible
		local function getPlayerHead(player)
			local character = player.Character
			if not character then
				return nil
			end
			return character:FindFirstChild("Head")
		end

		local function isAlreadyWelded(weld)
			return weld.Part1 ~= nil
		end

		logic.events.weldMountUpdate.invoked:Connect(function(player, data)
			if not player then
				return nil
			end

			local weld = data.block.PlayerWeldConstraint
			if not weld then
				return nil
			end

			local isWeldRequest = data.weldedState and not isAlreadyWelded(weld)

			-- ▶ Attach
			if isWeldRequest then
				local head = getPlayerHead(player)
				if not head then
					return nil
				end

				-- Offset behind head (tweak later if needed)
				weld.C0 = CFrame.new(0, 0, -head.Size.Z * 0.5)
				weld.Part1 = head

				ServerPartUtils.switchDescendantsNetworkOwner(data.block, player)

				logic.events.updateLogic:send("everyone", {
					block = data.block,
					weldedTo = player,
				})
				return nil
			end

			-- ▶ Detach
			weld.Part1 = nil
			ServerPartUtils.switchDescendantsNetworkOwner(data.block, data.owner)

			logic.events.updateLogic:send("everyone", {
				block = data.block,
				weldedTo = nil,
			})
			return
		end)
	end

	function HeadMountBlockServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(
			logic,
			di:resolve("server/modes/PlayModeController.ts$PlayModeController")
		)
	end
end

return {
	HeadMountBlockServerLogic = HeadMountBlockServerLogic,
}
