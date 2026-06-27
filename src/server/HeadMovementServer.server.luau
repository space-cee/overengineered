-- Head Follow Camera (SERVER)

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Remote = ReplicatedStorage:WaitForChild("Remotes"):WaitForChild("HeadLookRemote")

Remote.OnServerEvent:Connect(function(player, pitch, yaw)
	local char = player.Character
	if not char then return end

	local hum = char:FindFirstChildOfClass("Humanoid")
	if not hum then return end

	local isR6 = hum.RigType == Enum.HumanoidRigType.R6
	local torso = isR6 and char:FindFirstChild("Torso") or char:FindFirstChild("UpperTorso")
	local head = char:FindFirstChild("Head")

	if not torso or not head then return end

	local neck = torso:FindFirstChild("Neck") or head:FindFirstChild("Neck")
	if not neck or not neck:IsA("Motor6D") then return end

	local baseC0 = neck:GetAttribute("BaseC0")
	if not baseC0 then
		neck:SetAttribute("BaseC0", neck.C0)
		baseC0 = neck.C0
	end

	if isR6 then
		neck.C0 = baseC0 * CFrame.Angles(-pitch, 0, -yaw)
	else
		neck.C0 = baseC0 * CFrame.Angles(pitch, -yaw, 0)
	end
end)
