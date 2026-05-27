-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ServerBlockLogic = TS.import(script, game:GetService("ServerScriptService"), "TS", "blocks", "ServerBlockLogic").ServerBlockLogic
local SquareButtonBlock = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "blocks", "SquareButtonBlock").SquareButtonBlock
local SquareButtonServerLogic
do
	local super = ServerBlockLogic
	SquareButtonServerLogic = setmetatable({}, {
		__tostring = function()
			return "SquareButtonServerLogic"
		end,
		__csymbol = "server/blocks/logic/SquareButtonServerLogic.ts$SquareButtonServerLogic",
		__index = super,
	})
	SquareButtonServerLogic.__index = SquareButtonServerLogic
	function SquareButtonServerLogic.new(...)
		local self = setmetatable({}, SquareButtonServerLogic)
		return self:constructor(...) or self
	end
	function SquareButtonServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)
		SquareButtonBlock.logic.events.updateText:addServerMiddleware(function(player, arg)
			return {
				success = true,
				value = arg,
			}
		end)
	end
	function SquareButtonServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(logic, di:resolve("server/modes/PlayModeController.ts$PlayModeController"))
	end
end
return {
	SquareButtonServerLogic = SquareButtonServerLogic,
}