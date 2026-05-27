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
		local prevPos
		local cmdDir

		-- APN: target velocity and acceleration estimation
		local prevTargetPos = nil
		local prevTargetVel = Vector3.zero
		local targetVel = Vector3.zero
		local targetAccel = Vector3.zero

		self:onTicc(function(_param)
			local dt = _param.dt > 0 and _param.dt or (1/60)

			local targetPos = inputValues.targetPosition
			local objPos = inputValues.objPosition
			local N = inputValues.N
			local K = inputValues.K
			local alpha = math.clamp(inputValues.alpha, 0.01, 1.0)

			if not targetPos or not objPos then
				self.output.steering:set("vector3", Vector3.zero)
				return
			end

			-- Estimate target velocity with frame rate independent smoothing
			if prevTargetPos then
				local rawVel = (targetPos - prevTargetPos) / dt
				local velSmoothing = 1 - math.exp(-5 * dt)
				targetVel = targetVel + (rawVel - targetVel) * velSmoothing

				-- Estimate target acceleration with frame rate independent smoothing
				local rawAccel = (targetVel - prevTargetVel) / dt
				local accelSmoothing = 1 - math.exp(-3 * dt)
				targetAccel = targetAccel + (rawAccel - targetAccel) * accelSmoothing
				prevTargetVel = targetVel
			end
			prevTargetPos = targetPos

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
					-- Standard PN term with dt for frame rate independence
					local angle = (N * cross_mag * dt) / magSq
					local axis = cross / cross_mag
					local cosA = math.cos(angle)
					local sinA = math.sin(angle)
					newCmdDir =
						newCmdDir * cosA +
						axis:Cross(newCmdDir) * sinA +
						axis * (axis:Dot(newCmdDir) * (1 - cosA))

					-- APN augmentation term using K gain
					local accelAlongLOS = u * targetAccel:Dot(u)
					local lateralAccel = targetAccel - accelAlongLOS
					local lateralAccelMag = lateralAccel.Magnitude
					if lateralAccelMag > 1e-6 then
						local accelAngle = K * lateralAccelMag / math.sqrt(magSq)
						local accelAxis = lateralAccel.Unit
						local cosB = math.cos(accelAngle)
						local sinB = math.sin(accelAngle)
						newCmdDir =
							newCmdDir * cosB +
							accelAxis:Cross(newCmdDir) * sinB +
							accelAxis * (accelAxis:Dot(newCmdDir) * (1 - cosB))
					end
				end
			end

			newCmdDir = newCmdDir.Unit

			-- Frame rate independent smoothing on final steering
			local smoothing = 1 - math.exp(-alpha * dt * 60)
			local smoothed = cmdDir + (newCmdDir - cmdDir) * smoothing
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
_object.description = "King Von the block"
_object.search = {
	partialAliases = { "augmented proportional navigation", "missile", "vector3" },
}
_object.logic = {
	definition = definition,
	ctor = Logic,
}
_object.requiredFeatures = { "lua_circuit" }
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