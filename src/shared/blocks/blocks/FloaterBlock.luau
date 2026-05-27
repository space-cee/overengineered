local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ComponentEvents2Macros = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "component", "ComponentEvents.propmacro").ComponentEvents2Macros
local RunService = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").RunService
local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation

local definition = {
	input = {
		buoyancy = {
			displayName = "Buoyancy",
			types = {
				number = {
					config = 500,
					clamp = {
						showAsSlider = true,
						min = 0,
						max = 500000000000,
						step = 0.01,
					},
				},
			},
		},
		drag = {
			displayName = "Water Drag",
			types = {
				number = {
					config = 500,
					clamp = {
						showAsSlider = true,
						min = 0,
						max = 500000000000,
						step = 0.01,
					},
				},
			},
		},
		rotationalDrag = {
			displayName = "Rotational Drag",
			types = {
				number = {
					config = 500,
					clamp = {
						showAsSlider = true,
						min = 0,
						max = 500000000000,
						step = 0.01,
					},
				},
			},
		},
	},
	output = {},
}

local Logic
do
	local super = InstanceBlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/FloaterBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic
	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end
	function Logic:constructor(block)
		super.constructor(self, definition, block)
		self.part = self.instance.Part

		self.vectorForce = self.part.VectorForce

		if not self.part:FindFirstChild("AngularVelocity") then
			self.angularVelocity = Instance.new("AngularVelocity")
			self.angularVelocity.Name = "AngularVelocity"
			self.angularVelocity.Parent = self.part
		else
			self.angularVelocity = self.part:FindFirstChild("AngularVelocity")
		end

		self.angularVelocity.MaxTorque = 40000

		local buoyancyCache = self:initializeInputCache("buoyancy")
		local dragCache = self:initializeInputCache("drag")
		local rotationalDragCache = self:initializeInputCache("rotationalDrag")


		local function getWaterInfo(position)
			local waterContainer = workspace:FindFirstChild("WaterParts")
			if not waterContainer then
				return false, 0
			end

			for event, waterPart in pairs(waterContainer:GetChildren()) do
				if waterPart:IsA("BasePart") then
					local size = waterPart.Size
					local pos = waterPart.Position

					if position.X >= pos.X - size.X/2 and position.X <= pos.X + size.X/2 and
						position.Z >= pos.Z - size.Z/2 and position.Z <= pos.Z + size.Z/2 then
						return true, pos.Y
					end
				end
			end

			return false, 0
		end

		local function isInAirBubble(position)
			local airBlocks = workspace:FindFirstChild("AirBlocks")
			if not airBlocks then
				return false
			end

			for event, airBlock in pairs(airBlocks:GetChildren()) do
				if airBlock:IsA("BasePart") then
					local relativePos = airBlock.CFrame:PointToObjectSpace(position)
					local halfSize = airBlock.Size / 2

					if math.abs(relativePos.X) <= halfSize.X and
						math.abs(relativePos.Y) <= halfSize.Y and
						math.abs(relativePos.Z) <= halfSize.Z then
						return true
					end
				end
			end

			return false
		end

		local f = function()
			local buoyancy = buoyancyCache.tryGet()
			local drag = dragCache.tryGet()
			local rotationalDrag = rotationalDragCache.tryGet()
			if not buoyancy or not drag or not rotationalDrag then
				self.vectorForce.Force = Vector3.new(0, 0, 0)
				self.angularVelocity.AngularVelocity = Vector3.new(0, 0, 0)
				return
			end

			local partPosition = self.part.Position
			local isInWater, waterHeight = getWaterInfo(partPosition)

			if isInAirBubble(partPosition) then
				isInWater = false
			end

			if isInWater then
				local partBottom = partPosition.Y - (self.part.Size.Y / 2)

				if partBottom < waterHeight then
					local submergedHeight = math.min(self.part.Size.Y, waterHeight - partBottom)
					local submergedPercentage = math.max(0, submergedHeight / self.part.Size.Y)

					local equilibriumDepth = (1 - (buoyancy / 1000)) * self.part.Size.Y
					local targetY = waterHeight - equilibriumDepth

					local displacement = targetY - partPosition.Y

					local springConstant = 0.5
					local restoringForce = displacement * springConstant * self.part.Mass * submergedPercentage

					local currentVelocity = self.part.Velocity

					local criticalDamping = 2 * math.sqrt(springConstant * self.part.Mass)
					local dampingCoefficient = math.min(criticalDamping * 1.5, drag / 100)
					local dampingForce = currentVelocity * dampingCoefficient * self.part.Mass * submergedPercentage

					local totalForce = Vector3.new(
						-dampingForce.X,
						restoringForce - dampingForce.Y,
						-dampingForce.Z
					)

					local maxForce = 50000 * self.part.Mass
					if totalForce.Magnitude > maxForce then
						totalForce = totalForce.Unit * maxForce
					end

					self.vectorForce.Force = totalForce

					local currentAngularVelocity = self.part.RotVelocity
					local angularDampingForce = -currentAngularVelocity * (rotationalDrag / 100) * submergedPercentage
					self.angularVelocity.AngularVelocity = angularDampingForce
				else
					self.vectorForce.Force = Vector3.new(0, 0, 0)
					self.angularVelocity.AngularVelocity = Vector3.new(0, 0, 0)
				end
			else
				self.vectorForce.Force = Vector3.new(0, 0, 0)
				self.angularVelocity.AngularVelocity = Vector3.new(0, 0, 0)
			end
		end

		local _event = self.event
		local _postSimulation = RunService.PostSimulation
		local event = _event
		local _1 = if type(event) == "table" and event.subscribe ~= nil then event.subscribe(event, _postSimulation, f) else ComponentEvents2Macros.subscribe(event, _postSimulation, f)
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "floaterblock"
_object.displayName = "Floater"
_object.description = "A block that floats in water with adjustable buoyancy and drag properties"
_object.logic = {
	definition = definition,
	ctor = Logic,
}
local FloaterBlock = _object

return {
	FloaterBlockLogic = Logic,
	FloaterBlock = FloaterBlock,
}