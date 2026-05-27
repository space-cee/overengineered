-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ServerBlockLogic = TS.import(script, game:GetService("ServerScriptService"), "TS", "blocks", "ServerBlockLogic").ServerBlockLogic
local Display16ServerLogic
do
	local super = ServerBlockLogic
	Display16ServerLogic = setmetatable({}, {
		__tostring = function()
			return "Display16ServerLogic"
		end,
		__csymbol = "server/blocks/logic/Display16ServerLogic.ts$Display16ServerLogic",
		__index = super,
	})
	Display16ServerLogic.__index = Display16ServerLogic
	function Display16ServerLogic.new(...)
		local self = setmetatable({}, Display16ServerLogic)
		return self:constructor(...) or self
	end
	function Display16ServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)
		logic.events.prepare.invoked:Connect(function(player, _param)
			local block = _param.block
			local baseColor = _param.baseColor
			if not self:isValidBlock(block, player) then
				return nil
			end
			local gui = block:WaitForChild("Screen"):WaitForChild("SurfaceGui")
			for x = 0, 15 do
				for y = 0, 15 do
					local frame = Instance.new("Frame")
					frame.BorderMode = Enum.BorderMode.Inset
					frame.BorderSizePixel = 0
					frame.BackgroundColor3 = baseColor
					frame.Name = `x{x}y{y}`
					frame.LayoutOrder = x + y * 32
					frame.Parent = gui
				end
			end
			gui.Enabled = true
			return
		end)
		logic.events.update.invoked:Connect(function(player, _param)
			local block = _param.block
			local changes = _param.changes
			if not self:isValidBlock(block, player) then
				return nil
			end
			local gui = block:WaitForChild("Screen"):WaitForChild("SurfaceGui")
			for _, _binding in changes do
				local frame = _binding[1]
				if not frame:IsDescendantOf(gui) then
					local _result = player
					if _result ~= nil then
						_result = _result:Kick("ban forev")
					end
					return _result
				end
			end
			for _, _binding in changes do
				local frame = _binding[1]
				local color = _binding[2]
				frame.BackgroundColor3 = color
			end
			return
		end)
		logic.events.fill.invoked:Connect(function(player, _param)
			local block = _param.block
			local color = _param.color
			local frames = _param.frames
			if not self:isValidBlock(block, player) then
				return nil
			end
			local gui = block:WaitForChild("Screen"):WaitForChild("SurfaceGui")
			for y = 0, #frames - 1 do
				for x = 0, #frames[y + 1] - 1 do
					if not frames[x + 1][y + 1]:IsDescendantOf(gui) then
						local _result = player
						if _result ~= nil then
							_result = _result:Kick("ban forev")
						end
						return _result
					end
					frames[x + 1][y + 1].BackgroundColor3 = color
				end
			end
			return
		end)
	end
	function Display16ServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(logic, di:resolve("server/modes/PlayModeController.ts$PlayModeController"))
	end
end
return {
	Display16ServerLogic = Display16ServerLogic,
}
