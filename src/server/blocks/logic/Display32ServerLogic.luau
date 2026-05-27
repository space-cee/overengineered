-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ServerBlockLogic = TS.import(script, game:GetService("ServerScriptService"), "TS", "blocks", "ServerBlockLogic").ServerBlockLogic
local Display32ServerLogic
do
	local super = ServerBlockLogic
	Display32ServerLogic = setmetatable({}, {
		__tostring = function()
			return "Display32ServerLogic"
		end,
		__csymbol = "server/blocks/logic/Display32ServerLogic.ts$Display16ServerLogic",
		__index = super,
	})
	Display32ServerLogic.__index = Display32ServerLogic
	function Display32ServerLogic.new(...)
		local self = setmetatable({}, Display32ServerLogic)
		return self:constructor(...) or self
	end
	function Display32ServerLogic:constructor(logic, playModeController)
		super.constructor(self, logic, playModeController)
		logic.events.prepare.invoked:Connect(function(player, _param)
			local block = _param.block
			local baseColor = _param.baseColor
			if not self:isValidBlock(block, player) then
				return nil
			end
			local gui = block:WaitForChild("Screen"):WaitForChild("SurfaceGui")
			for x = 0, 31 do
				for y = 0, 31 do
					local frame = Instance.new("Frame")
					frame.BorderMode = Enum.BorderMode.Inset
					frame.BorderSizePixel = 0
					frame.BackgroundColor3 = baseColor
					frame.Name = `x{x}y{y}`
					frame.LayoutOrder = x + y * 64
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
	function Display32ServerLogic:_depsCreate(_____instance, di, logic)
		return _____instance:constructor(logic, di:resolve("server/modes/PlayModeController.ts$PlayModeController"))
	end
end
return {
	Display32ServerLogic = Display32ServerLogic,
}
