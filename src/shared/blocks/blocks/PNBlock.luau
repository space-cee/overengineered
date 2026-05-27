-- from veve, PN block using cross-product rotation method, updated :D
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local BlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").BlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local definition = {
	inputOrder = {
		"targetPosition",
		"objPosition",
		"N",
	},
	input = {
		targetPosition = {
			displayName = "Target Position",
			types = {
				vector3 = {},
			},
		},
		objPosition = {
			displayName = "Object Position",
			types = {
				vector3 = {},
			},
		},
		N = {
			displayName = "Navigation Constant",
			types = {
				number = {
					config = 4,
				},
			},
		},
	},
	output = {
		steering = {
			displayName = "Steering",
			types = { "vector3" },
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
		__csymbol = "shared/blocks/blocks/PNBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic
	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end
	function Logic:constructor(block)
		super.constructor(self, definition, block)
		local inputValues = {
			targetPosition = Vector3.zero,
			objPosition = Vector3.zero,
			N = 4,
		}
		self:on(function(data)
			inputValues = data
			return inputValues
		end)
		local prevPos
		local cmdDir
		self:onTicc(function(_param)
			local targetPos = inputValues.targetPosition
			local objPos = inputValues.objPosition
			local N = inputValues.N
			if not targetPos or not objPos then
				self.output.steering:set("vector3", Vector3.zero)
				return
			end
			local r = targetPos - objPos
			local magSq = r:Dot(r)
			if magSq == 0 then
				self.output.steering:set("vector3", Vector3.zero)
				return
			end
			local u = r.Unit
			if not prevPos then
				prevPos = r
				cmdDir = u
			end
			local newCmdDir = cmdDir
			if magSq > 225 then
				local cross = prevPos:Cross(r)
				local cross_mag = cross.Magnitude
				if cross_mag > 1e-6 then
					local angle = (N * cross_mag) / magSq
					local axis = cross / cross_mag
					local cosA = math.cos(angle)
					local sinA = math.sin(angle)
					newCmdDir =
						newCmdDir * cosA +
						axis:Cross(newCmdDir) * sinA +
						axis * (axis:Dot(newCmdDir) * (1 - cosA))
				end
			end
			newCmdDir = newCmdDir.Unit
			cmdDir = newCmdDir
			prevPos = r
			self.output.steering:set("vector3", newCmdDir)
		end)
	end
end
local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "pnguidanceblock"
_object.displayName = "PN Guidance"
_object.description = "Plug and Play."
_object.search = {
	partialAliases = { "proportional navigation", "missile", "vector3" },
}
_object.logic = {
	definition = definition,
	ctor = Logic,
}
_object.modelSource = {
	model = BlockCreation.Model.fAutoCreated("x4GenericLogicBlockPrefab", "PN"),
	category = function()
		return BlockCreation.Categories.other
	end,
}
local PNBlock = _object
return {
	PNBlockLogic = Logic,
	PNBlock = PNBlock,

}