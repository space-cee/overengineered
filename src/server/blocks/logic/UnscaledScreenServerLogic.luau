-- UnscaledScreenServerLogic.lua
-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ServerBlockLogic = TS.import(script, game:GetService("ServerScriptService"), "TS", "blocks", "ServerBlockLogic").ServerBlockLogic
local UnscaledScreenBlock = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "blocks", "UnscaledScreenBlock").UnscaledScreenBlock

local UnscaledScreenServerLogic
do
	local super = ServerBlockLogic
	UnscaledScreenServerLogic = setmetatable({}, {
		__tostring = function()
			return "UnscaledScreenServerLogic"
		end,
		__csymbol = "server/blocks/logic/UnscaledScreenServerLogic.ts$UnscaledScreenServerLogic",
		__index = super,
	})
	UnscaledScreenServerLogic.__index = UnscaledScreenServerLogic

	function UnscaledScreenServerLogic.new(...)
		local self = setmetatable({}, UnscaledScreenServerLogic)
		return self:constructor(...) or self
	end

	function UnscaledScreenServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)

		UnscaledScreenBlock.logic.events.update:addServerMiddleware(function(player, arg)
			return {
				success = true,
				value = arg,
			}
		end)
	end

	function UnscaledScreenServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(logic, di:resolve("server/modes/PlayModeController.ts$PlayModeController"))
	end
end

return {
	UnscaledScreenServerLogic = UnscaledScreenServerLogic,
}
