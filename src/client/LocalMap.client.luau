local player = game.Players.LocalPlayer
local rs = game:GetService("ReplicatedStorage")
local UIS = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local TeleportService = game:GetService("TeleportService")
local TEST_PLACE_ID = 125844796933744
local MAIN_PLACE_ID = 104961158429462

local toggleEvent = rs:WaitForChild("HeadLookToggle")


local lastTab = "Other" -- Defaults to Other since Maps is removed

-- gui
local gui = Instance.new("ScreenGui")
gui.ResetOnSpawn = false
gui.Parent = player:WaitForChild("PlayerGui")

-- menu button
local open = Instance.new("TextButton")
open.Size = UDim2.new(0,36,0,36)
open.Position = UDim2.new(0.01,0,0.02,0)
open.Text = "extra"
open.TextScaled = true
open.BackgroundColor3 = Color3.fromRGB(40,40,40)
open.BackgroundTransparency = 0.5 
open.TextColor3 = Color3.new(1,1,1)
open.Parent = gui
Instance.new("UICorner", open)

-- frame
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0.32,0,0,0) -- wider menu
frame.Position = UDim2.new(
	open.Position.X.Scale,
	open.Position.X.Offset,
	open.Position.Y.Scale,
	open.Position.Y.Offset + open.AbsoluteSize.Y + 4
)
frame.BackgroundColor3 = Color3.fromRGB(30,30,30)
frame.Visible = false
frame.Parent = gui
Instance.new("UICorner", frame)

local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(70,70,70)
stroke.Parent = frame

-- tabs
local tabBar = Instance.new("Frame")
tabBar.Size = UDim2.new(1,-6,0,28)
tabBar.Position = UDim2.new(0,3,0,3)
tabBar.BackgroundTransparency = 1
tabBar.Parent = frame

-- Two tabs remain: Split sizing 50/50
local otherTab = Instance.new("TextButton")
otherTab.Size = UDim2.new(0.5,-2,1,0)
otherTab.Position = UDim2.new(0,0,0,0)
otherTab.Text = "Other"
otherTab.TextScaled = true
otherTab.BackgroundColor3 = Color3.fromRGB(60,60,60)
otherTab.TextColor3 = Color3.new(1,1,1)
otherTab.Parent = tabBar
Instance.new("UICorner", otherTab)

local changelogTab = Instance.new("TextButton")
changelogTab.Size = UDim2.new(0.5,-2,1,0)
changelogTab.Position = UDim2.new(0.5,2,0,0)
changelogTab.Text = "Changelog"
changelogTab.TextScaled = true
changelogTab.BackgroundColor3 = Color3.fromRGB(40,40,40)
changelogTab.TextColor3 = Color3.new(1,1,1)
changelogTab.Parent = tabBar
Instance.new("UICorner", changelogTab)

-- pages base template (Replaces old mapsPage layout dependency)
local pageTemplate = Instance.new("Frame")
pageTemplate.Size = UDim2.new(1,-6,1,-40)
pageTemplate.Position = UDim2.new(0,3,0,34)
pageTemplate.BackgroundTransparency = 1

local otherPage = pageTemplate:Clone()
otherPage.Visible = true
otherPage.Parent = frame

local changelogPage = pageTemplate:Clone()
changelogPage.Visible = false
changelogPage.Parent = frame

-- scroll setups
local changelogScroll = Instance.new("ScrollingFrame")
changelogScroll.Size = UDim2.new(1,-6,1,-10)
changelogScroll.Position = UDim2.new(0,3,0,6)
changelogScroll.BackgroundTransparency = 1
changelogScroll.ScrollBarThickness = 6
changelogScroll.Parent = changelogPage

local padding = Instance.new("UIPadding")
padding.PaddingTop = UDim.new(0,6)
padding.PaddingBottom = UDim.new(0,6)
padding.PaddingLeft = UDim.new(0,6)
padding.PaddingRight = UDim.new(0,6)
padding.Parent = changelogScroll

local changelogLayout = Instance.new("UIListLayout")
changelogLayout.Padding = UDim.new(0,3)
changelogLayout.SortOrder = Enum.SortOrder.LayoutOrder
changelogLayout.Parent = changelogScroll

local changelogModule = require(script.Parent:WaitForChild("Changelog"))
local changelogString = changelogModule.changelog -- Extracts the string from the table

local function addLabel(text,size,color,bold)
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1,0,0,0)
	label.AutomaticSize = Enum.AutomaticSize.Y
	label.BackgroundTransparency = 1
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.TextYAlignment = Enum.TextYAlignment.Top
	label.TextWrapped = true
	label.TextColor3 = color
	label.TextSize = size
	label.Font = bold and Enum.Font.SourceSansBold or Enum.Font.SourceSans
	label.Text = text
	label.Parent = changelogScroll
end

for line in string.gmatch(changelogString,"[^\n]+") do
	line = line:gsub("^%s+","")

	if line:find("%d%d? %a+ %d%d%d%d") then
		addLabel(line,19,Color3.fromRGB(200,220,255),true)

		local space = Instance.new("Frame")
		space.Size = UDim2.new(1,0,0,4)
		space.BackgroundTransparency = 1
		space.Parent = changelogScroll
	elseif line:sub(1,1) == "-" then
		local text = "• "..line:sub(3)
		addLabel(text,16,Color3.new(1,1,1),false)
	else
		addLabel(line,16,Color3.new(1,1,1),false)
	end
end

changelogLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
	changelogScroll.CanvasSize = UDim2.new(0,0,0,changelogLayout.AbsoluteContentSize.Y + 10)
end)

-- other scroll view
local otherScroll = Instance.new("ScrollingFrame")
otherScroll.Size = UDim2.new(1,-6,1,-6)
otherScroll.Position = UDim2.new(0,3,0,3)
otherScroll.BackgroundTransparency = 1
otherScroll.ScrollBarThickness = 4
otherScroll.Parent = otherPage

local otherLayout = Instance.new("UIListLayout")
otherLayout.Padding = UDim.new(0,5)
otherLayout.Parent = otherScroll

otherLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
	otherScroll.CanvasSize = UDim2.new(0,0,0,otherLayout.AbsoluteContentSize.Y + 5)
end)

-- head look
local headEnabled = false

local headButton = Instance.new("TextButton")
headButton.Size = UDim2.new(1,-6,0,30)
headButton.Text = "Head Look: OFF"
headButton.TextScaled = true
headButton.BackgroundColor3 = Color3.fromRGB(40,40,40)
headButton.TextColor3 = Color3.new(1,1,1)
headButton.Parent = otherScroll
Instance.new("UICorner", headButton)

headButton.MouseButton1Click:Connect(function()
	headEnabled = not headEnabled
	headButton.Text = headEnabled and "Head Look: ON" or "Head Look: OFF"
	toggleEvent:Fire(headEnabled)
end)

-- rejoin
local rejoinButton = Instance.new("TextButton")
rejoinButton.Size = UDim2.new(1,-6,0,30)
rejoinButton.Text = "Rejoin Server"
rejoinButton.TextScaled = true
rejoinButton.BackgroundColor3 = Color3.fromRGB(40,40,40)
rejoinButton.TextColor3 = Color3.new(1,1,1)
rejoinButton.Parent = otherScroll
Instance.new("UICorner", rejoinButton)

rejoinButton.MouseButton1Click:Connect(function()
	TeleportService:Teleport(game.PlaceId, player)
end)

-- test place button (Replaced old Lite Mode)
local testPlaceButton = Instance.new("TextButton")
testPlaceButton.Size = UDim2.new(1,-6,0,30)
testPlaceButton.Text = "Legacy Game"
testPlaceButton.TextScaled = true
testPlaceButton.BackgroundColor3 = Color3.fromRGB(40,40,40)
testPlaceButton.TextColor3 = Color3.new(1,1,1)
testPlaceButton.Parent = otherScroll
Instance.new("UICorner", testPlaceButton)

testPlaceButton.MouseButton1Click:Connect(function()
	TeleportService:Teleport(TEST_PLACE_ID, player)
end)

-- main game button
local mainButton = Instance.new("TextButton")
mainButton.Size = UDim2.new(1,-6,0,30)
mainButton.Text = "Main Game"
mainButton.TextScaled = true
mainButton.BackgroundColor3 = Color3.fromRGB(40,40,40)
mainButton.TextColor3 = Color3.new(1,1,1)
mainButton.Parent = otherScroll
Instance.new("UICorner", mainButton)

mainButton.MouseButton1Click:Connect(function()
	TeleportService:Teleport(MAIN_PLACE_ID, player)
end)

-- private server code
local codeBox = Instance.new("TextBox")
codeBox.Size = UDim2.new(1,-6,0,30)
codeBox.PlaceholderText = "Enter Private Server Code"
codeBox.Text = ""
codeBox.TextScaled = true
codeBox.BackgroundColor3 = Color3.fromRGB(35,35,35)
codeBox.TextColor3 = Color3.new(1,1,1)
codeBox.Parent = otherScroll
Instance.new("UICorner", codeBox)

codeBox:GetPropertyChangedSignal("Text"):Connect(function()
	codeBox.Text = codeBox.Text:lower()
end)

-- status
local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1,-6,0,20)
statusLabel.Text = ""
statusLabel.TextScaled = true
statusLabel.BackgroundTransparency = 1
statusLabel.TextColor3 = Color3.fromRGB(200,200,200)
statusLabel.Parent = otherScroll

-- private servers
local joinPrivateButton = Instance.new("TextButton")
joinPrivateButton.Size = UDim2.new(1,-6,0,30)
joinPrivateButton.Text = "Join / Create Private Server"
joinPrivateButton.TextScaled = true
joinPrivateButton.BackgroundColor3 = Color3.fromRGB(40,40,40)
joinPrivateButton.TextColor3 = Color3.new(1,1,1)
joinPrivateButton.Parent = otherScroll
Instance.new("UICorner", joinPrivateButton)

joinPrivateButton.MouseButton1Click:Connect(function()
	local code = codeBox.Text

	if code and code ~= "" then
		statusLabel.Text = "Joining / Creating server..."
		rs:WaitForChild("JoinPrivateServer"):FireServer(code)
	else
		statusLabel.Text = "Enter a code first"
	end
end)

codeBox.FocusLost:Connect(function(enterPressed)
	if enterPressed then
		joinPrivateButton:Activate()
	end
end)

rs:WaitForChild("JoinPrivateServer").OnClientEvent:Connect(function(message)
	if message == "InvalidCode" then
		statusLabel.Text = "Invalid code"
	elseif message == "TooLong" then
		statusLabel.Text = "Code too long (max 20)"
	elseif message == "Teleporting" then
		statusLabel.Text = "Teleporting..."
	end
end)

-- freecam speed controller
local speed = _G.FreecamSpeed or 1

local speedLabel = Instance.new("TextLabel")
speedLabel.Size = UDim2.new(1,-6,0,20)
speedLabel.Text = "Freecam Speed: 1.0"
speedLabel.BackgroundTransparency = 1
speedLabel.TextColor3 = Color3.new(1,1,1)
speedLabel.Parent = otherScroll

local sliderContainer = Instance.new("Frame")
sliderContainer.Size = UDim2.new(1,-6,0,24)
sliderContainer.BackgroundTransparency = 1
sliderContainer.Parent = otherScroll

local minus = Instance.new("TextButton")
minus.Size = UDim2.new(0,24,1,0)
minus.Text = "-"
minus.TextScaled = true
minus.BackgroundColor3 = Color3.fromRGB(60,60,60)
minus.TextColor3 = Color3.new(1,1,1)
minus.Parent = sliderContainer
Instance.new("UICorner", minus)

local plus = Instance.new("TextButton")
plus.Size = UDim2.new(0,24,1,0)
plus.Position = UDim2.new(1,-24,0,0)
plus.Text = "+"
plus.TextScaled = true
plus.BackgroundColor3 = Color3.fromRGB(60,60,60)
plus.TextColor3 = Color3.new(1,1,1)
plus.Parent = sliderContainer
Instance.new("UICorner", plus)

local sliderFrame = Instance.new("Frame")
sliderFrame.Size = UDim2.new(1,-56,1,0)
sliderFrame.Position = UDim2.new(0,28,0,0)
sliderFrame.BackgroundColor3 = Color3.fromRGB(50,50,50)
sliderFrame.Parent = sliderContainer
Instance.new("UICorner", sliderFrame)

local fill = Instance.new("Frame")
fill.Size = UDim2.new(0.25,0,1,0)
fill.BackgroundColor3 = Color3.fromRGB(100,200,100)
fill.Parent = sliderFrame
Instance.new("UICorner", fill)

local draggingSlider = false

local MIN_SPEED = 0.05
local MAX_SPEED = 2

local function updateUI()
	local percent = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)
	fill.Size = UDim2.new(percent,0,1,0)
	speedLabel.Text = "Freecam Speed: "..string.format("%.2f", speed)
	_G.FreecamSpeed = speed
end

local function setFromPercent(percent)
	percent = math.clamp(percent, 0, 1)
	speed = MIN_SPEED + percent * (MAX_SPEED - MIN_SPEED)
	updateUI()
end

local function setFromMouse(x)
	local percent = x / sliderFrame.AbsoluteSize.X
	setFromPercent(percent)
end

sliderFrame.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		draggingSlider = true
		setFromMouse(input.Position.X - sliderFrame.AbsolutePosition.X)
	end
end)

UIS.InputChanged:Connect(function(input)
	if draggingSlider and input.UserInputType == Enum.UserInputType.MouseMovement then
		setFromMouse(input.Position.X - sliderFrame.AbsolutePosition.X)
	end
end)

UIS.InputEnded:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		draggingSlider = false
	end
end)

minus.MouseButton1Click:Connect(function()
	speed = math.clamp(speed - 0.05, MIN_SPEED, MAX_SPEED)
	updateUI()
end)

plus.MouseButton1Click:Connect(function()
	speed = math.clamp(speed + 0.05, MIN_SPEED, MAX_SPEED)
	updateUI()
end)

updateUI()

-- switch tab logic
local function switchTab(tab)
	lastTab = tab

	otherPage.Visible = false
	changelogPage.Visible = false

	otherTab.BackgroundColor3 = Color3.fromRGB(40,40,40)
	changelogTab.BackgroundColor3 = Color3.fromRGB(40,40,40)

	if tab == "Other" then
		otherPage.Visible = true
		otherTab.BackgroundColor3 = Color3.fromRGB(60,60,60)
	elseif tab == "Changelog" then
		changelogPage.Visible = true
		changelogTab.BackgroundColor3 = Color3.fromRGB(60,60,60)
	end
end

otherTab.MouseButton1Click:Connect(function()
	switchTab("Other")
end)

changelogTab.MouseButton1Click:Connect(function()
	switchTab("Changelog")
end)

-- open/close
local openTween = TweenService:Create(
	frame,
	TweenInfo.new(0.25, Enum.EasingStyle.Quad),
	{Size = UDim2.new(0.32,0,0.45,0)}
)

local closeTween = TweenService:Create(
	frame,
	TweenInfo.new(0.2),
	{Size = UDim2.new(0.32,0,0,0)}
)

local opened = false

open.MouseButton1Click:Connect(function()
	if opened then
		closeTween:Play()
		task.wait(0.2)
		frame.Visible = false
	else
		frame.Size = UDim2.new(open.Size.X.Scale,0,0,0)
		frame.Visible = true
		openTween:Play()
		switchTab(lastTab)
	end
	opened = not opened
end)

-- drag logic
local dragging = false
local dragStart
local startPos

local function updateDrag(input)
	local delta = input.Position - dragStart
	local newX = startPos.X.Offset + delta.X
	local newY = startPos.Y.Offset + delta.Y

	local screen = gui.AbsoluteSize
	local btnSize = open.AbsoluteSize

	newX = math.clamp(newX, 0, screen.X - btnSize.X)
	newY = math.clamp(newY, -55, screen.Y - btnSize.Y)

	open.Position = UDim2.new(0, newX, 0, newY)
	frame.Position = UDim2.new(0, newX, 0, newY + btnSize.Y + 4)
end

open.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1
		or input.UserInputType == Enum.UserInputType.Touch then

		dragging = true
		dragStart = input.Position
		startPos = open.Position

		input.Changed:Connect(function()
			if input.UserInputState == Enum.UserInputState.End then
				dragging = false
			end
		end)
	end
end)

UIS.InputChanged:Connect(function(input)
	if dragging then
		updateDrag(input)
	end
end)