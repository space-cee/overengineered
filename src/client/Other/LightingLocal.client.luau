local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")
local RunService = game:GetService("RunService")

local DAY_START_TIME = 6
local DAY_END_TIME = 18
local TRANSITION_DURATION = 2

local DAY_SETTINGS = {
	EnvironmentDiffuseScale = 1,
	EnvironmentSpecularScale = 1,
	Brightness = 4,
	OutdoorAmbient = Color3.fromRGB(32, 37, 39),
	Ambient = Color3.fromRGB(24, 29, 31)
}

local NIGHT_SETTINGS = {
	EnvironmentDiffuseScale = 0,
	EnvironmentSpecularScale = 0,
	Brightness = 0.05,
	OutdoorAmbient = Color3.fromRGB(0, 0, 0),
	Ambient = Color3.fromRGB(0, 0, 0)
}

local lightingUpdateConnection

local function lerp(a, b, alpha)
	return a + (b - a) * alpha
end

local function lerpColor3(a, b, alpha)
	return Color3.new(
		a.R + (b.R - a.R) * alpha,
		a.G + (b.G - a.G) * alpha,
		a.B + (b.B - a.B) * alpha
	)
end

local function isInTransition(currentTime, startTime, endTime, duration)
	local eveningStartTime = endTime - duration
	if currentTime >= eveningStartTime and currentTime < endTime then
		return true, (currentTime - eveningStartTime) / duration, "evening"
	end

	local dawnStartTime = startTime - duration
	if dawnStartTime < 0 then
		if currentTime >= (dawnStartTime + 24) or currentTime < startTime then
			local adjustedTime = (currentTime < startTime) and (currentTime + 24) or currentTime
			return true, (adjustedTime - (dawnStartTime + 24)) / duration, "morning"
		end
	elseif currentTime >= dawnStartTime and currentTime < startTime then
		return true, (currentTime - dawnStartTime) / duration, "morning"
	end

	return false, 0, ""
end

local function getDepthDarkness()
	local camera = Workspace.CurrentCamera
	if not camera then return 0, false end

	local cameraPosition = camera.CFrame.Position
	local waterContainer = Workspace:FindFirstChild("WaterParts")

	if not waterContainer then return 0, false end

	local isUnderwater = false
	local maxDepth = 0

	for _, waterPart in pairs(waterContainer:GetChildren()) do
		if waterPart:IsA("BasePart") then
			local size = waterPart.Size
			local pos = waterPart.Position

			if cameraPosition.X >= pos.X - size.X/2 and cameraPosition.X <= pos.X + size.X/2 and
				cameraPosition.Z >= pos.Z - size.Z/2 and cameraPosition.Z <= pos.Z + size.Z/2 then
				if cameraPosition.Y < pos.Y then
					isUnderwater = true
					local depth = pos.Y - cameraPosition.Y
					if depth > maxDepth then
						maxDepth = depth
					end
				end
			end
		end
	end

	if not isUnderwater then
		return 0, false
	end

	local darknessFactor = math.min(maxDepth / 1250, 1)
	return darknessFactor, true
end

local function updateLighting()
	local currentTime = Lighting.ClockTime
	currentTime = currentTime % 24

	local inTransition, alpha, transitionType = isInTransition(currentTime, DAY_START_TIME, DAY_END_TIME, TRANSITION_DURATION)

	local targetDiffuse, targetSpecular, targetBrightness, targetAmbient, targetAmbientLight

	if inTransition then
		if transitionType == "evening" then
			targetDiffuse = lerp(DAY_SETTINGS.EnvironmentDiffuseScale, NIGHT_SETTINGS.EnvironmentDiffuseScale, alpha)
			targetSpecular = lerp(DAY_SETTINGS.EnvironmentSpecularScale, NIGHT_SETTINGS.EnvironmentSpecularScale, alpha)
			targetBrightness = lerp(DAY_SETTINGS.Brightness, NIGHT_SETTINGS.Brightness, alpha)
			targetAmbient = lerpColor3(DAY_SETTINGS.OutdoorAmbient, NIGHT_SETTINGS.OutdoorAmbient, alpha)
			targetAmbientLight = lerpColor3(DAY_SETTINGS.Ambient, NIGHT_SETTINGS.Ambient, alpha)
		else
			targetDiffuse = lerp(NIGHT_SETTINGS.EnvironmentDiffuseScale, DAY_SETTINGS.EnvironmentDiffuseScale, alpha)
			targetSpecular = lerp(NIGHT_SETTINGS.EnvironmentSpecularScale, DAY_SETTINGS.EnvironmentSpecularScale, alpha)
			targetBrightness = lerp(NIGHT_SETTINGS.Brightness, DAY_SETTINGS.Brightness, alpha)
			targetAmbient = lerpColor3(NIGHT_SETTINGS.OutdoorAmbient, DAY_SETTINGS.OutdoorAmbient, alpha)
			targetAmbientLight = lerpColor3(NIGHT_SETTINGS.Ambient, DAY_SETTINGS.Ambient, alpha)
		end
	elseif currentTime >= DAY_START_TIME and currentTime < DAY_END_TIME then
		targetDiffuse = DAY_SETTINGS.EnvironmentDiffuseScale
		targetSpecular = DAY_SETTINGS.EnvironmentSpecularScale
		targetBrightness = DAY_SETTINGS.Brightness
		targetAmbient = DAY_SETTINGS.OutdoorAmbient
		targetAmbientLight = DAY_SETTINGS.Ambient
	else
		targetDiffuse = NIGHT_SETTINGS.EnvironmentDiffuseScale
		targetSpecular = NIGHT_SETTINGS.EnvironmentSpecularScale
		targetBrightness = NIGHT_SETTINGS.Brightness
		targetAmbient = NIGHT_SETTINGS.OutdoorAmbient
		targetAmbientLight = NIGHT_SETTINGS.Ambient
	end

	local depthDarkness, isUnderwater = getDepthDarkness()

	if targetDiffuse then
		local adjustedDiffuse = targetDiffuse * (1 - depthDarkness)
		local adjustedSpecular = targetSpecular * (1 - depthDarkness)

		Lighting.EnvironmentDiffuseScale = math.clamp(adjustedDiffuse, 0, 1)
		Lighting.EnvironmentSpecularScale = math.clamp(adjustedSpecular, 0, 1)

		if isUnderwater then
			Lighting.Brightness = 0
		else
			Lighting.Brightness = math.clamp(targetBrightness, 0, 4)
		end

		if targetAmbient then
			local darkenedAmbient = Color3.new(
				targetAmbient.R * (1 - depthDarkness),
				targetAmbient.G * (1 - depthDarkness),
				targetAmbient.B * (1 - depthDarkness)
			)
			Lighting.OutdoorAmbient = darkenedAmbient
		end

		if targetAmbientLight then
			local darkenedAmbientLight = Color3.new(
				targetAmbientLight.R * (1 - depthDarkness),
				targetAmbientLight.G * (1 - depthDarkness),
				targetAmbientLight.B * (1 - depthDarkness)
			)
			Lighting.Ambient = darkenedAmbientLight
		end
	end
end

if lightingUpdateConnection then
	lightingUpdateConnection:Disconnect()
end

lightingUpdateConnection = RunService.Heartbeat:Connect(function()
	updateLighting()
end)

local renderSteppedConnection = RunService.RenderStepped:Connect(function()
	updateLighting()
end)

script.AncestryChanged:Connect(function()
	if not script.Parent then
		if lightingUpdateConnection then
			lightingUpdateConnection:Disconnect()
		end
		if renderSteppedConnection then
			renderSteppedConnection:Disconnect()
		end
	end
end)
