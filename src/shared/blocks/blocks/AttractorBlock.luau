local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))

local RunService = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").RunService
local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local BlockManager = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "building", "BlockManager").BlockManager

local function getAllBlockFolders()
	local plots = workspace:FindFirstChild("Plots")
	if not plots then return {} end

	local folders = {}

	for _, plot in ipairs(plots:GetChildren()) do
		local blocks = plot:FindFirstChild("Blocks")
		if blocks then
			table.insert(folders, blocks)
		end
	end

	return folders
end

local definition = {
	inputOrder = {
		"strength",
		"distance",
		"tidalMultiplier",
		"useAssemblyMass",
		"attractionMode",
		"customReference",
		"customExponent",
	},
	input = {
		strength = {
			displayName = "Strength",
			types = {
				number = {
					config = 1000000,
					clamp = {
						showAsSlider = true,
						min = -100,
						max = 100,
					},
				},
			},
		},
		distance = {
			displayName = "Distance multiplier",
			types = {
				number = {
					config = 1,
				},
			},
		},
		tidalMultiplier = {
			displayName = "Tidal Multiplier",
			types = {
				number = {
					config = 1,
					clamp = {
						showAsSlider = true,
						min = 0,
						max = 10,
					},
				},
			},
		},
		useAssemblyMass = {
			displayName = "Use Assembly Mass",
			types = {
				bool = {
					config = true, 
				},
			},
		},
		attractionMode = {
			displayName = "Attraction Mode",
			connectorHidden = true,
			types = {
				enum = {
					config = "gravity",
					elementOrder = {
						"gravity",
						"custom",
						"magnetic",
						"inverse",
					},
					elements = {
						gravity = {
							displayName = "Gravity (1/r²)",
						},
						custom = {
							displayName = "Custom",
							tooltip = "Current default behavior",
						},
						magnetic = {
							displayName = "Magnetic",
							tooltip = "Strong nearby, weak far",
						},
						inverse = {
							displayName = "Inverse (1/r)",
						},
					},
				},
			},
		},
		customReference = {
			displayName = "Custom Reference",
			types = {
				number = {
					config = 10,
					clamp = {
						showAsSlider = true,
						min = 0.1,
						max = 100,
					},
				},
			},
		},
		customExponent = {
			displayName = "Custom r^n Exponent",
			types = {
				number = {
					config = 2,
					clamp = {
						showAsSlider = true,
						min = 0,
						max = 6,
					},
				},
			},
		},
	},
	output = {},
}

local attractors = {}

local function getOrCreateForce(root)
	local existing = root:FindFirstChild("AttractorForce")
	if existing then return existing end

	local attachment = root:FindFirstChild("AttractorAttachment")
	if not attachment then
		attachment = Instance.new("Attachment")
		attachment.Name = "AttractorAttachment"
		attachment.Parent = root
	end

	local vf = Instance.new("VectorForce")
	vf.Name = "AttractorForce"
	vf.Attachment0 = attachment
	vf.Force = Vector3.zero
	vf.RelativeTo = Enum.ActuatorRelativeTo.World
	vf.ApplyAtCenterOfMass = true
	vf.Parent = root

	return vf
end

local function getOrCreateTorque(root)
	local existing = root:FindFirstChild("AttractorTorque")
	if existing then return existing end

	local attachment = root:FindFirstChild("AttractorAttachment")
	if not attachment then
		attachment = Instance.new("Attachment")
		attachment.Name = "AttractorAttachment"
		attachment.Parent = root
	end

	local torque = Instance.new("Torque")
	torque.Name = "AttractorTorque"
	torque.Attachment0 = attachment
	torque.RelativeTo = Enum.ActuatorRelativeTo.World
	torque.Torque = Vector3.zero
	torque.Parent = root

	return torque
end

local G = 20
local REF_DISTANCE = 10
local MIN_DIST = 0.05
local MAX_FORCE = 1000000

local function applyGravity(attractor, part2)
	local root1 = attractor.part.AssemblyRootPart
	local root2 = part2.AssemblyRootPart

	if root1 == root2 then return end

	local pos1
	local m1

	if attractor.useAssemblyMass then
		pos1 = root1.Position
		m1 = root1:GetMass()
	else
		pos1 = attractor.part.Position
		m1 = attractor.part:GetMass()
	end

	local pos2 = root2.Position

	local diff = pos2 - pos1
	local dist = diff.Magnitude
	if dist < 0.5 then return end

	local maxDist = 50 * attractor.distanceMultiplier
	if dist > maxDist then return end

	local dir = diff.Unit

	local ndist = math.max(dist / REF_DISTANCE, MIN_DIST)

	local rootMass = root1:GetMass()
	local partMass = attractor.part:GetMass()

	local effectiveG = G

	if not attractor.useAssemblyMass then
		local ratio = rootMass / math.max(partMass, 0.01)
		ratio = math.clamp(ratio, 1, 50)

		effectiveG = G * ratio
	end

	local m2 = root2:GetMass()
	local strength = attractor:getStrength()

	local mode = attractor.attractionMode or "gravity"
	local forceMagnitude

	if mode == "gravity" then
		forceMagnitude = (effectiveG * m1 * m2) / (ndist * ndist)

	elseif mode == "inverse" then
		forceMagnitude = (effectiveG * m1 * m2) / ndist

	elseif mode == "magnetic" then
		forceMagnitude = (effectiveG * m1 * m2) / (ndist ^ 3)

	elseif mode == "custom" then
		local ref = math.max(attractor.customReference or 10, 0.1)
		local exponent = attractor.customExponent or 2

		local customDist = math.max(dist / ref, MIN_DIST)

		forceMagnitude = (effectiveG * m1 * m2) / (customDist ^ exponent)

		if exponent < 1 then
			forceMagnitude *= (1 + exponent)
		end
	end

	forceMagnitude *= strength

	forceMagnitude = math.clamp(forceMagnitude, -MAX_FORCE, MAX_FORCE)

	local force = dir * forceMagnitude

	local damping = 2

	local vel2 = root2.AssemblyLinearVelocity
	local vel1 = root1.AssemblyLinearVelocity

	local drag2 = -vel2 * damping
	local drag1 = -vel1 * damping

	local vf2 = getOrCreateForce(root2)
	vf2.Force += (-force + drag2)

	local vf1 = getOrCreateForce(root1)
	vf1.Force += (force + drag1)

	local mult = attractor.tidalMultiplier or 0

	if mult <= 0 then
		return
	end

	local torqueObj = getOrCreateTorque(root2)

	local desiredDir = (pos1 - pos2).Unit
	local currentDir = root2.CFrame.LookVector

	local axis = currentDir:Cross(desiredDir)

	if axis.Magnitude > 0.001 then
		local dot = math.clamp(currentDir:Dot(desiredDir), -1, 1)
		local angle = math.acos(dot)

		local alignmentFalloff = angle / math.pi

		local torqueStrength = 500 * mult

		local alignTorque = axis.Unit * angle * torqueStrength * alignmentFalloff

		local angularVel = root2.AssemblyAngularVelocity
		local angularDamping = 5 + (10 * mult)

		local dampingTorque = -angularVel * angularDamping

		torqueObj.Torque += alignTorque + dampingTorque
	end
end

RunService.PostSimulation:Connect(function()
	if #attractors == 0 then return end

	local blockFolders = getAllBlockFolders()
	if #blockFolders == 0 then return end

	for _, folder in ipairs(blockFolders) do
		for _, model in ipairs(folder:GetChildren()) do
			local part = model.PrimaryPart or model:FindFirstChildWhichIsA("BasePart")
			if not part then continue end

			local root = part.AssemblyRootPart

			local vf = root:FindFirstChild("AttractorForce")
			if vf then
				vf.Force = Vector3.zero
			end

			local torque = root:FindFirstChild("AttractorTorque")
			if torque then
				torque.Torque = Vector3.zero
			end
		end
	end

	for _, attractor in ipairs(attractors) do
		local part1 = attractor.part
		local strength = attractor:getStrength()

		if strength == 0 then continue end

		for _, folder in ipairs(blockFolders) do
			for _, model in ipairs(folder:GetChildren()) do
				local part2 = model.PrimaryPart or model:FindFirstChildWhichIsA("BasePart")
				if not part2 then continue end
				if part2 == part1 then continue end

				if part2.AssemblyRootPart == part1.AssemblyRootPart then
					continue
				end

				applyGravity(attractor, part2)
			end
		end
	end
end)

local Logic
do
	local super = InstanceBlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/AttractorBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic

	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block)
		super.constructor(self, definition, block)

		self.part = self.instance:WaitForChild("Part")

		self.strength = 0
		self.distanceMultiplier = 1
		self.tidalMultiplier = 1
		self.useAssemblyMass = true
		self.attractionMode = "gravity"
		self.customReference = 10
		self.customExponent = 2

		local blockScale = BlockManager.manager.scale.get(block.instance) or Vector3.one
		self.scale = blockScale.X * blockScale.Y * blockScale.Z

		self:onk({ "strength" }, function(v)
			self.strength = v.strength
		end)

		self:onk({ "distance" }, function(v)
			self.distanceMultiplier = v.distance
		end)

		self:onk({ "tidalMultiplier" }, function(v)
			self.tidalMultiplier = v.tidalMultiplier
		end)

		self:onk({ "useAssemblyMass" }, function(v)
			self.useAssemblyMass = v.useAssemblyMass
		end)

		self:onk({ "attractionMode" }, function(v)
			self.attractionMode = v.attractionMode
		end)

		self:onk({ "customReference" }, function(v)
			self.customReference = v.customReference
		end)

		self:onk({ "customExponent" }, function(v)
			self.customExponent = v.customExponent
		end)

		self:onEnable(function()
			table.insert(attractors, self)
		end)

	end

	function Logic:getStrength()
		return self.strength * self.scale
	end

	function Logic:destroy()
		local i = table.find(attractors, self)
		if i then
			table.remove(attractors, i)
		end

		super.destroy(self)
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)

_object.id = "attractor"
_object.displayName = "Attractor"
_object.description = "Pulls in all nearby blocks (or repels if inverted)"
_object.search = {
	partialAliases = { "magnet", "gravity" },
}
_object.logic = {
	definition = definition,
	ctor = Logic,
}

return {
	AttractorBlockLogic = Logic,
	AttractorBlock = _object,
}