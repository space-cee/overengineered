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
	inputOrder = { "strength", "invert", "distance" },
	input = {
		strength = {
			displayName = "Strength",
			types = {
				number = {
					config = 100,
					clamp = {
						showAsSlider = true,
						min = 0,
						max = 100,
					},
				},
			},
		},
		invert = {
			displayName = "Invert (Repel)",
			types = {
				bool = {
					config = false,
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
	},
	output = {},
}

local attractors = {}
local magicNumber = 60

local G = 2000 -- tweak this

local function applyGravity(attractor, part2, dt)
	local root1 = attractor.part.AssemblyRootPart
	local root2 = part2.AssemblyRootPart

	if root1 == root2 then return end

	local pos1 = root1.Position
	local pos2 = root2.Position

	local diff = pos2 - pos1
	local dist = diff.Magnitude

	if dist < 0.5 then return end

	local maxDist = 50 * attractor.distanceMultiplier
	if dist > maxDist then return end

	local dir = diff.Unit

	local m1 = root1:GetMass()
	local m2 = root2:GetMass()

	local forceMagnitude = (G * m1 * m2) / (dist * dist)

	if attractor.invert then
		forceMagnitude = -forceMagnitude
	end

	local force = dir * forceMagnitude * dt

	root1:ApplyImpulse(force)
	root2:ApplyImpulse(-force)
end

RunService.PostSimulation:Connect(function(dt)
	if #attractors == 0 then return end

	local blockFolders = getAllBlockFolders()
	if #blockFolders == 0 then return end

	for _, attractor in ipairs(attractors) do
		local part1 = attractor.part
		local strength = attractor:getStrength() * magicNumber * dt

		if strength == 0 then continue end


		for _, folder in ipairs(blockFolders) do
			for _, model in ipairs(folder:GetChildren()) do
				local part2 = model.PrimaryPart or model:FindFirstChildWhichIsA("BasePart")
				if not part2 then continue end
				if part2 == part1 then continue end

				-- skip same assembly
				if part2.AssemblyRootPart == part1.AssemblyRootPart then
					continue
				end

				applyGravity(attractor, part2, dt)
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
		self.invert = false

		local blockScale = BlockManager.manager.scale.get(block.instance) or Vector3.one
		self.scale = blockScale.X * blockScale.Y * blockScale.Z

		self:onk({ "strength" }, function(v)
			self.strength = v.strength
		end)

		self:onk({ "distance" }, function(v)
			self.distanceMultiplier = v.distance
		end)

		self:onk({ "invert" }, function(v)
			self.invert = v.invert
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

-- block definition
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