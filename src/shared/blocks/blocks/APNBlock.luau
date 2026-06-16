-- from veve, APN block using cross-product rotation method
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local BlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").BlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local definition = {
	inputOrder = {
		"targetPosition",
		"objPosition",
		"N",
		"K",
		"alpha",
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
		K = {
			displayName = "Acceleration Gain",
			types = {
				number = {
					config = 2,
				},
			},
		},
		alpha = {
			displayName = "Steering Smoothing",
			types = {
				number = {
					config = 0.15,
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
		__csymbol = "shared/blocks/blocks/APNBlock.ts$Logic",
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
			K = 2,
			alpha = 0.15,
		}
		self:on(function(data)
			inputValues = data
			return inputValues
		end)

		local prevPos = nil
		local prevLosDelta = nil
		local cmdDir = nil

		self:onTicc(function(_param)
			local targetPos = inputValues.targetPosition
			local objPos = inputValues.objPosition
			local N = inputValues.N
			local K = inputValues.K
			local alpha = math.clamp(inputValues.alpha, 0.01, 1.0)

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

			-- Initialize on first frame
			if not prevPos then
				prevPos = r
				prevLosDelta = Vector3.zero
				cmdDir = u
				self.output.steering:set("vector3", u)
				return
			end

			local newCmdDir = cmdDir

			if magSq > 225 then
				local losDelta = prevPos:Cross(r) / magSq
				local rotVec = losDelta * (N + K) - prevLosDelta * K
				local angle = rotVec.Magnitude

				if angle > 1e-8 then
					local axis = rotVec / angle
					local cosA = math.cos(angle)
					local sinA = math.sin(angle)
					newCmdDir =
						newCmdDir * cosA +
						axis:Cross(newCmdDir) * sinA +
						axis * (axis:Dot(newCmdDir) * (1 - cosA))
				end

				prevLosDelta = losDelta
			end

			-- Normalize
			if newCmdDir.Magnitude > 1e-6 then
				newCmdDir = newCmdDir.Unit
			else
				newCmdDir = cmdDir
			end

			-- Smooth and output
			local smoothed = cmdDir:Lerp(newCmdDir, alpha)
			if smoothed.Magnitude > 1e-6 then
				smoothed = smoothed.Unit
			else
				smoothed = cmdDir
			end

			cmdDir = smoothed
			prevPos = r
			self.output.steering:set("vector3", smoothed)
		end)
	end
end
local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "apnguidanceblock"
_object.displayName = "APN Guidance"
_object.description = "PN but on 99.1% chemically pure crystal"
_object.search = {
	partialAliases = { "augmented proportional navigation", "missile", "vector3" },
}
_object.logic = {
	definition = definition,
	ctor = Logic,
}
_object.modelSource = {
	model = BlockCreation.Model.fAutoCreated("x4GenericLogicBlockPrefab", "APN"),
	category = function()
		return BlockCreation.Categories.other
	end,
}
local APNBlock = _object
return {
	APNBlockLogic = Logic,
	APNBlock = APNBlock,
}