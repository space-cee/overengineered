local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Workspace = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Workspace
local GameDefinitions = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "data", "GameDefinitions").GameDefinitions
local RunService = game:GetService("RunService")
--local Debris = game:GetService("Debris")
local SoundService = game:GetService("SoundService")
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")

local AltWaterTerrainChunkRenderer = function()
	local chunkSize = 256
	--local partSize = 256
	local waterHeight = GameDefinitions.HEIGHT_OFFSET - 10
	local waterColor = Color3.new(1, 1, 1)

	local waterContainer = Instance.new("Folder")
	waterContainer.Name = "WaterParts"
	waterContainer.Parent = Workspace

	local activeChunks = {}
	local underwaterRegions = {}

	local underwaterColorCorrection = Instance.new("ColorCorrectionEffect")
	underwaterColorCorrection.Name = "UnderwaterColorCorrection"
	underwaterColorCorrection.Parent = Lighting
	underwaterColorCorrection.Enabled = false

	local underwaterBlur = Instance.new("BlurEffect")
	underwaterBlur.Name = "UnderwaterBlur"
	underwaterBlur.Parent = Lighting
	underwaterBlur.Enabled = false
	underwaterBlur.Size = 10

	local underwaterSound = Instance.new("Sound")
	underwaterSound.SoundId = ("rbxassetid://85919992253730")
	underwaterSound.Volume = 1
	underwaterSound.Looped = true
	underwaterSound.Name = "UnderwaterSound"
	underwaterSound.Parent = SoundService

	local soundEqualizers = {}
	local isUnderwater = false
	local soundUpdateQueue = {}
	local isProcessingSounds = false

	local waveTime = 0
	local waveSpeed = 1
	local waveAmplitude = 5
	local originalPositions = {}

	local function queueSoundForUpdate(sound, addEqualizer)
		table.insert(soundUpdateQueue, {
			sound = sound,
			addEqualizer = addEqualizer
		})
	end

	local function createWaterPart(chunkX, chunkZ)
		local chunkKey = string.format("%d_%d", chunkX, chunkZ)

		if activeChunks[chunkKey] then
			return activeChunks[chunkKey]
		end

		local posX = chunkX * chunkSize
		local posZ = chunkZ * chunkSize

		local waterPart = Instance.new("Part")
		waterPart.Size = Vector3.new(chunkSize, 0.001, chunkSize)
		waterPart.Position = Vector3.new(posX, waterHeight, posZ)
		waterPart.Anchored = true
		waterPart.CanCollide = false
		waterPart.CanTouch = false
		waterPart.CanQuery = false
		waterPart.Material = Enum.Material.Ice
		waterPart.MaterialVariant = "Water"
		waterPart.BrickColor = BrickColor.new(waterColor)
		waterPart.Name = string.format("Water_%d_%d", chunkX, chunkZ)
		waterPart.Parent = waterContainer

		originalPositions[chunkKey] = Vector3.new(posX, waterHeight, posZ)

		activeChunks[chunkKey] = {
			water = waterPart
		}

		underwaterRegions[chunkKey] = {
			minX = posX - chunkSize/2,
			maxX = posX + chunkSize/2,
			minZ = posZ - chunkSize/2,
			maxZ = posZ + chunkSize/2,
			waterHeight = waterHeight
		}

		return activeChunks[chunkKey]
	end

	local function removeWaterPart(chunkX, chunkZ)
		local chunkKey = string.format("%d_%d", chunkX, chunkZ)
		local chunkParts = activeChunks[chunkKey]

		if chunkParts then
			if chunkParts.water then
				chunkParts.water:Destroy()
			end
			if chunkParts.seafloor then
				chunkParts.seafloor:Destroy()
			end
			activeChunks[chunkKey] = nil
			underwaterRegions[chunkKey] = nil
			originalPositions[chunkKey] = nil
		end
	end

	local function isWaterAtPosition(position)
		local chunkX = math.floor(position.X / chunkSize)
		local chunkZ = math.floor(position.Z / chunkSize)
		local chunkKey = string.format("%d_%d", chunkX, chunkZ)

		local chunkParts = activeChunks[chunkKey]
		return chunkParts and chunkParts.water and chunkParts.water.Parent
	end

	local function checkUnderwater(position)
		for _, region in pairs(underwaterRegions) do
			if position.X >= region.minX and position.X <= region.maxX and
				position.Z >= region.minZ and position.Z <= region.maxZ and
				position.Y < region.waterHeight then
				return true, region.waterHeight
			end
		end
		return false, 0
	end

	local function addEqualizerToSound(sound)
		if soundEqualizers[sound] then return end

		local equalizer = Instance.new("EqualizerSoundEffect")
		equalizer.Name = "UnderwaterEQ"
		equalizer.Parent = sound
		equalizer.HighGain = -80
		equalizer.MidGain = 0
		equalizer.LowGain = 10

		soundEqualizers[sound] = equalizer
	end

	local function removeEqualizerFromSound(sound)
		local equalizer = soundEqualizers[sound]
		if equalizer then
			equalizer:Destroy()
			soundEqualizers[sound] = nil
		end
	end

	local function processSoundQueue()
		if isProcessingSounds or #soundUpdateQueue == 0 then return end
		isProcessingSounds = true

		local toProcess = math.min(10, #soundUpdateQueue)
		for i = 1, toProcess do
			local soundData = table.remove(soundUpdateQueue, 1)
			if soundData.addEqualizer then
				addEqualizerToSound(soundData.sound)
			else
				removeEqualizerFromSound(soundData.sound)
			end
		end

		isProcessingSounds = false

		if #soundUpdateQueue > 0 then
			processSoundQueue()
		end
	end

	local function updateAllSounds(addEqualizer)
		local function scanSounds(parent)
			for _, child in pairs(parent:GetChildren()) do
				if child:IsA("Sound") then
					queueSoundForUpdate(child, addEqualizer)
				end

				scanSounds(child)
			end
		end

		soundUpdateQueue = {}

		scanSounds(Workspace)
		scanSounds(SoundService)
		scanSounds(Lighting)
		scanSounds(Players)
		scanSounds(game:GetService("StarterPlayer"))
		scanSounds(game:GetService("StarterGui"))
		scanSounds(game:GetService("StarterPack"))

		processSoundQueue()
	end

	local function updateWaterWaves(deltaTime)
		waveTime = waveTime + deltaTime * waveSpeed

		local waveOffset = math.sin(waveTime) * waveAmplitude

		for chunkKey, chunkParts in pairs(activeChunks) do
			if chunkParts.water and originalPositions[chunkKey] then
				local originalPos = originalPositions[chunkKey]
				chunkParts.water.Position = Vector3.new(
					originalPos.X + waveOffset,
					originalPos.Y,
					originalPos.Z
				)
			end
		end
	end

	local function updateUnderwaterEffects()
		local camera = Workspace.CurrentCamera
		if not camera then return end

		local cameraPosition = camera.CFrame.Position
		local wasUnderwater = isUnderwater
		isUnderwater, _ = checkUnderwater(cameraPosition)

		local airBlocks = Workspace:FindFirstChild("AirBlocks")
		if airBlocks and isUnderwater then
			for _, airBlock in pairs(airBlocks:GetChildren()) do
				if airBlock:IsA("BasePart") then
					local relativePos = airBlock.CFrame:PointToObjectSpace(cameraPosition)
					local halfSize = airBlock.Size / 2

					if math.abs(relativePos.X) <= halfSize.X and
						math.abs(relativePos.Y) <= halfSize.Y and
						math.abs(relativePos.Z) <= halfSize.Z then
						isUnderwater = false
						break
					end
				end
			end
		end

		if wasUnderwater ~= isUnderwater then
			if isUnderwater then
				underwaterColorCorrection.Enabled = true
				underwaterColorCorrection.TintColor = Color3.new(0.1, 0.3, 0.5)
				underwaterColorCorrection.Contrast = 0.3
				underwaterColorCorrection.Saturation = -0.7

				underwaterBlur.Enabled = true

				underwaterSound.Playing = true

				updateAllSounds(true)
			else
				underwaterColorCorrection.Enabled = false
				underwaterBlur.Enabled = false
				underwaterSound.Playing = false

				updateAllSounds(false)
			end
		end
	end

	--local lastTime = 0
	RunService.Heartbeat:Connect(function(deltaTime)
		updateUnderwaterEffects()
		updateWaterWaves(deltaTime)
	end)

	local function connectToDescendantAdded(service)
		service.DescendantAdded:Connect(function(descendant)
			if descendant:IsA("Sound") and isUnderwater then
				queueSoundForUpdate(descendant, true)
				processSoundQueue()
			end
		end)
	end

	connectToDescendantAdded(Workspace)
	connectToDescendantAdded(SoundService)
	connectToDescendantAdded(Lighting)
	connectToDescendantAdded(Players)
	connectToDescendantAdded(game:GetService("StarterPlayer"))
	connectToDescendantAdded(game:GetService("StarterGui"))
	connectToDescendantAdded(game:GetService("StarterPack"))
	connectToDescendantAdded(game:GetService("Teams"))

	return {
		chunkSize = chunkSize,
		renderChunk = function(self, chunkX, chunkZ)
			if math.random() > 0.9 then
				task.wait()
			end

			createWaterPart(chunkX, chunkZ)
			return true
		end,
		destroyChunk = function(self, chunkX, chunkZ)
			if math.random() > 0.9 then
				task.wait()
			end

			removeWaterPart(chunkX, chunkZ)
		end,
		unloadAll = function(self, chunks)
			for chunkKey, chunkParts in pairs(activeChunks) do
				if chunkParts.water then
					chunkParts.water:Destroy()
				end
				if chunkParts.seafloor then
					chunkParts.seafloor:Destroy()
				end
			end
			activeChunks = {}
			underwaterRegions = {}
			originalPositions = {}
		end,
		destroy = function(self)
			if waterContainer then
				waterContainer:Destroy()
			end

			if underwaterColorCorrection then
				underwaterColorCorrection:Destroy()
			end

			if underwaterBlur then
				underwaterBlur:Destroy()
			end

			if underwaterSound then
				underwaterSound:Destroy()
			end

			for sound, _ in pairs(soundEqualizers) do
				removeEqualizerFromSound(sound)
			end
		end,
		getWaterHeight = function(self, x, z)
			return waterHeight
		end,
		isWaterAtPosition = function(self, position)
			return isWaterAtPosition(position)
		end,
		isUnderwater = function(self, position)
			return checkUnderwater(position)
		end,
	}
end

return {
	AltWaterTerrainChunkRenderer = AltWaterTerrainChunkRenderer,
}