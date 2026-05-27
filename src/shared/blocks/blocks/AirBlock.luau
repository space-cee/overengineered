local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local InstanceBlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").InstanceBlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation

local definition = {
	input = {},
	output = {},
}

local Logic
do
	local super = InstanceBlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/AirBlock.ts$Logic",
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

		local airBlocksContainer = workspace:FindFirstChild("AirBlocks")
		if not airBlocksContainer then
			airBlocksContainer = Instance.new("Folder")
			airBlocksContainer.Name = "AirBlocks"
			airBlocksContainer.Parent = workspace
		end

		self.part:SetAttribute("IsAirBlock", true)

		self.part.Parent = airBlocksContainer
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "airblock"
_object.displayName = "Air Block"
_object.description = "Creates an air pocket underwater that disables water effects and swimming"
_object.logic = {
	definition = definition,
	ctor = Logic,
}
local AirBlock = _object

return {
	AirBlockLogic = Logic,
	AirBlock = AirBlock,
}