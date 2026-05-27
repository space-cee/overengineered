local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")

-- CONFIG
local moon = workspace:WaitForChild("The Moon"):WaitForChild("The Moon (PBR)")
local gravityRange = 20000  -- optional weak attraction
local planetaryRange = 3000 -- full surface walking within this range
local maxForce = 250        -- gravity strength
local walkSpeed = 16        -- player movement speed
local jumpImpulse = 50      -- jump force
local maxResponsiveness = 25 -- rotation responsiveness

-- Helper to project a vector onto a plane
local function projectVectorOntoPlane(vector, planeNormal)
	return (vector - vector:Dot(planeNormal) * planeNormal)
end

-- Custom controller per character
local function setupCharacter(character)
	local root = character:WaitForChild("HumanoidRootPart")
	local humanoid = character:WaitForChild("Humanoid")

	humanoid.AutoRotate = false

	-- Attachments and forces
	local attachment = Instance.new("Attachment")
	attachment.Parent = root

	local vectorForce = Instance.new("VectorForce")
	vectorForce.Attachment0 = attachment
	vectorForce.RelativeTo = Enum.ActuatorRelativeTo.World
	vectorForce.ApplyAtCenterOfMass = true
	vectorForce.Parent = root

	local alignOrientation = Instance.new("AlignOrientation")
	alignOrientation.Attachment0 = attachment
	alignOrientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
	alignOrientation.RigidityEnabled = false
	alignOrientation.MaxTorque = math.huge
	alignOrientation.Enabled = false
	alignOrientation.Parent = root

	-- Input vector
	local moveVector = Vector3.zero
	UserInputService.InputBegan:Connect(function(input, gpe)
		if gpe then return end
		if input.UserInputType == Enum.UserInputType.Keyboard then
			moveVector = moveVector + Vector3.FromNormalId(input.KeyCode)
		end
	end)
	UserInputService.InputEnded:Connect(function(input, gpe)
		if gpe then return end
		if input.UserInputType == Enum.UserInputType.Keyboard then
			moveVector = moveVector - Vector3.FromNormalId(input.KeyCode)
		end
	end)

	local canJump = true
	
	RunService.Heartbeat:Connect(function(deltaTime)
		if not character.Parent then return end

		local offset = moon.Position - root.Position
		local distance = offset.Magnitude
		local gravityDir = offset.Unit

		-- Apply weak gravity over full range
		if distance <= gravityRange then
			local alpha = math.clamp((gravityRange - distance) / gravityRange, 0, 1)
			vectorForce.Force = gravityDir * (maxForce * alpha)
		else
			vectorForce.Force = Vector3.zero
		end

		-- Planetary walking only in range
		if distance <= planetaryRange then
			alignOrientation.Enabled = true
			local alpha = (planetaryRange - distance) / planetaryRange
			alignOrientation.Responsiveness = maxResponsiveness * alpha

			local upVector = -gravityDir
			local camCF = Workspace.CurrentCamera.CFrame
			local forward = projectVectorOntoPlane(camCF.LookVector, upVector).Unit
			local right = forward:Cross(upVector).Unit

			alignOrientation.CFrame = CFrame.fromMatrix(root.Position, right, upVector)

			-- Movement along tangent plane
			local moveDir = Vector3.zero
			if UserInputService:IsKeyDown(Enum.KeyCode.W) then moveDir = moveDir + forward end
			if UserInputService:IsKeyDown(Enum.KeyCode.S) then moveDir = moveDir - forward end
			if UserInputService:IsKeyDown(Enum.KeyCode.A) then moveDir = moveDir - right end
			if UserInputService:IsKeyDown(Enum.KeyCode.D) then moveDir = moveDir + right end

			if moveDir.Magnitude > 0 then
				moveDir = moveDir.Unit
				local velocity = moveDir * walkSpeed

				-- Ensure gravity only affects vertical direction and movement is applied horizontally
				local horizontalVelocity = projectVectorOntoPlane(root.Velocity, upVector)
				root.Velocity = horizontalVelocity + velocity + upVector * root.Velocity:Dot(upVector)
			end

			-- Jumping
			if UserInputService:IsKeyDown(Enum.KeyCode.Space) and canJump then
				root.Velocity = root.Velocity + upVector * jumpImpulse
				canJump = false
			elseif root.Position.Y - moon.Position.Y <= planetaryRange then
				canJump = true
			end

		else
			-- Outside planetary range: revert to normal Humanoid
			alignOrientation.Enabled = false
			humanoid.AutoRotate = true
		end
	end)
end

-- Connect new players
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(setupCharacter)
end)

for _, player in pairs(Players:GetPlayers()) do
	if player.Character then
		setupCharacter(player.Character)
	end
	player.CharacterAdded:Connect(setupCharacter)
end