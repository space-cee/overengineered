local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Workspace = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Workspace

local SwimmingController = {}
SwimmingController.__index = SwimmingController

local BUOYANCY_FORCE = 450
local WATER_DRAG = 0.99
local VERTICAL_WATER_DRAG_MULTIPLIER = 5

function SwimmingController.new(player)
	local self = setmetatable({}, SwimmingController)

	self.player = player or Players.LocalPlayer
	self.character = self.player.Character or self.player.CharacterAdded:Wait()
	self.humanoid = self.character:WaitForChild("Humanoid")
	self.humanoidRootPart = self.character:WaitForChild("HumanoidRootPart")

	self.limbForces = {}

	self.isSwimming = false
	self.lastSwimStateChange = 0
	self.stateChangeCooldown = 0.1

	self.lastDamageTime = 0
	self.damageInterval = 0.1

	self.player.CharacterAdded:Connect(function(newCharacter)
		self.character = newCharacter
		self.humanoid = newCharacter:WaitForChild("Humanoid")
		self.humanoidRootPart = newCharacter:WaitForChild("HumanoidRootPart")
		self:CleanupLimbForces()
		self:CreateLimbForces()
		self.isSwimming = false
		self.lastDamageTime = 0
	end)

	self:CreateLimbForces()

	RunService.Heartbeat:Connect(function(deltaTime)
		self:UpdateSwimmingPhysics(deltaTime)
	end)

	return self
end

function SwimmingController:CreateLimbForces()
	self:CleanupLimbForces()

	local limbs = {}

	for _, child in pairs(self.character:GetChildren()) do
		if child:IsA("BasePart") and (child.Name:find("Upper") or child.Name:find("Lower") or
			child.Name:find("Left") or child.Name:find("Right") or
			child.Name:find("Arm") or child.Name:find("Leg")) then
			if child ~= self.humanoidRootPart then
				table.insert(limbs, child)
			end
		end
	end

	if #limbs == 0 then
		local r6Limbs = {"Left Arm", "Right Arm", "Left Leg", "Right Leg", "Torso", "Head"}
		for _, limbName in pairs(r6Limbs) do
			local limb = self.character:FindFirstChild(limbName)
			if limb and limb:IsA("BasePart") then
				table.insert(limbs, limb)
			end
		end
	end

	for _, limb in pairs(limbs) do
		if not self.limbForces[limb] then
			local attachment = Instance.new("Attachment")
			attachment.Name = "SwimAttachment"
			attachment.Parent = limb

			local vectorForce = Instance.new("VectorForce")
			vectorForce.Name = "SwimForce"
			vectorForce.Parent = limb
			vectorForce.Attachment0 = attachment
			vectorForce.Force = Vector3.new(0, 0, 0)
			vectorForce.ApplyAtCenterOfMass = false
			vectorForce.RelativeTo = Enum.ActuatorRelativeTo.World
			vectorForce.Enabled = true

			self.limbForces[limb] = vectorForce
		end
	end
end

function SwimmingController:CleanupLimbForces()
	for limb, vectorForce in pairs(self.limbForces) do
		if vectorForce and vectorForce.Parent then
			local attachment = vectorForce.Attachment0
			if attachment and attachment.Parent then
				attachment:Destroy()
			end
			vectorForce:Destroy()
		end
	end
	self.limbForces = {}
end

function SwimmingController:UpdateSwimmingPhysics(deltaTime)
	local isInWater = false
	local waterHeight = 0
	local waterDepth = 0

	local rootPosition = self.humanoidRootPart.Position
	local waterContainer = Workspace:FindFirstChild("WaterParts")

	if waterContainer then
		for _, waterPart in pairs(waterContainer:GetChildren()) do
			if waterPart:IsA("BasePart") then
				local size = waterPart.Size
				local pos = waterPart.Position

				if rootPosition.X >= pos.X - size.X/2 and rootPosition.X <= pos.X + size.X/2 and
					rootPosition.Z >= pos.Z - size.Z/2 and rootPosition.Z <= pos.Z + size.Z/2 and
					rootPosition.Y < pos.Y then
					isInWater = true
					waterHeight = pos.Y
					waterDepth = waterHeight - rootPosition.Y
					break
				end
			end
		end
	end

	local isInAirBlock = false
	local airBlocks = Workspace:FindFirstChild("AirBlocks")
	if airBlocks and isInWater then
		for _, airBlock in pairs(airBlocks:GetChildren()) do
			if airBlock:IsA("BasePart") then
				local relativePos = airBlock.CFrame:PointToObjectSpace(rootPosition)
				local halfSize = airBlock.Size / 2

				if math.abs(relativePos.X) <= halfSize.X and
					math.abs(relativePos.Y) <= halfSize.Y and
					math.abs(relativePos.Z) <= halfSize.Z then
					isInWater = false
					isInAirBlock = true
					break
				end
			end
		end
	end

	local currentTime = tick()
	if self.isSwimming ~= isInWater and (currentTime - self.lastSwimStateChange) > self.stateChangeCooldown then
		self.isSwimming = isInWater
		self.lastSwimStateChange = currentTime

		if isInWater then
			if self.humanoid:GetState() ~= Enum.HumanoidStateType.Swimming then
				self.humanoid:ChangeState(Enum.HumanoidStateType.Swimming)
			end
		else
			if self.humanoid:GetState() == Enum.HumanoidStateType.Swimming then
				self.humanoid:ChangeState(Enum.HumanoidStateType.Running)
			end
		end
	end

	if isInWater and not isInAirBlock then
		if waterDepth > 50 then
			if waterDepth >= 750 then
				self.humanoid.Health = 0
			else
				if currentTime - self.lastDamageTime >= self.damageInterval then
					local damagePercent = (waterDepth - 50) / 700
					local damage = 1 + (10 * damagePercent)
					self.humanoid:TakeDamage(damage)
					self.lastDamageTime = currentTime
				end
			end
		end
	end

	if isInWater then
		for limb, vectorForce in pairs(self.limbForces) do
			if limb and vectorForce then
				local limbBottom = limb.Position.Y - (limb.Size.Y / 2)
				local submergedPercentage = 0

				if limbBottom < waterHeight then
					--local limbTop = limb.Position.Y + (limb.Size.Y / 2)
					local submergedHeight = math.min(limb.Size.Y, waterHeight - limbBottom)
					submergedPercentage = math.max(0, submergedHeight / limb.Size.Y)
				end

				local buoyancyForce = Vector3.new(0, BUOYANCY_FORCE * submergedPercentage * limb.Mass, 0)
				vectorForce.Force = buoyancyForce

				local currentVelocity = limb.Velocity
				local horizontalVelocity = Vector3.new(currentVelocity.X, 0, currentVelocity.Z)
				local verticalVelocity = Vector3.new(0, currentVelocity.Y, 0)

				limb.Velocity = horizontalVelocity * WATER_DRAG + verticalVelocity * (WATER_DRAG / VERTICAL_WATER_DRAG_MULTIPLIER)
			end
		end

		local currentVelocity = self.humanoidRootPart.Velocity
		local horizontalVelocity = Vector3.new(currentVelocity.X, 0, currentVelocity.Z)
		local verticalVelocity = Vector3.new(0, currentVelocity.Y, 0)

		self.humanoidRootPart.Velocity = horizontalVelocity * WATER_DRAG + verticalVelocity * (WATER_DRAG / VERTICAL_WATER_DRAG_MULTIPLIER)
	else
		for _, vectorForce in pairs(self.limbForces) do
			if vectorForce then
				vectorForce.Force = Vector3.new(0, 0, 0)
			end
		end
	end
end

return SwimmingController