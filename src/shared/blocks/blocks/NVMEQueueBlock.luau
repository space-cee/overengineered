-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Objects = TS.import(script, game:GetService("ReplicatedStorage"), "engine", "fixes", "Objects").Objects
local BlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").BlockLogic
local BlockConfigDefinitions = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockConfigDefinitions").BlockConfigDefinitions
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local BlockManager = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "building", "BlockManager").BlockManager

local definition = {
	inputOrder = { "value", "enqueue", "dequeue", "clear" },
	outputOrder = { "result", "size" },
	input = {
		enqueue = {
			displayName = "Enqueue",
			types = {
				bool = {
					config = false,
				},
			},
			configHidden = true,
		},
		dequeue = {
			displayName = "Dequeue",
			types = {
				bool = {
					config = false,
				},
			},
			configHidden = true,
		},
		value = {
			displayName = "Input",
			types = BlockConfigDefinitions.any,
			group = "1",
		},
		clear = {
			displayName = "Clear",
			types = BlockConfigDefinitions.bool,
			configHidden = true,
		},
	},
	output = {
		size = {
			displayName = "Size",
			types = { "number" },
		},
		result = {
			displayName = "Output",
			types = Objects.keys(BlockConfigDefinitions.any),
			group = "1",
		},
	},
}

local size = 0xff
local Logic
do
	local super = BlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/NVMEQueueBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic

	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block, s)
		super.constructor(self, definition, block)

		-- 1. RETRIEVE DATA FROM PERSISTENT STORAGE
		local savedCustomData = BlockManager.manager.customData.get(block.instance)
		local internalMemory = (savedCustomData ~= nil and savedCustomData.storedQueue) or {}

		
		s:schedule(function(building, plot)
			local _building = building
			local _object = {
				plot = plot,
			}
			local _left = "datas"
			local _object_1 = {
				block = block.instance,
			}
			local _left_1 = "data"
			local _object_2 = table.clone((BlockManager.manager.customData.get(block.instance) or {}))
			setmetatable(_object_2, nil)

			
			_object_2.storedQueue = internalMemory

			_object_1[_left_1] = _object_2
			_object[_left] = { _object_1 }
			_building:updateCustomData(_object)
		end)

		
		local enqueueValue = function(value, valueType)
			if #internalMemory >= size then
				self:disableAndBurn()
				return nil
			end

			table.insert(internalMemory, {
				value = value,
				type = valueType,
			})
			self.output.size:set("number", #internalMemory)
			return
		end

		local dequeueValue = function()
			local item = table.remove(internalMemory, 1)
			if item == nil then
				self:disableAndBurn()
				return nil
			end

			self.output.result:set(item.type, item.value)
			self.output.size:set("number", #internalMemory)
			return
		end

	
		self:onkFirstInputs({}, function()
			self.output.size:set("number", #internalMemory)
		end)

		-- 4. EVENT LISTENERS
		self:onk({ "dequeue" }, function(_param)
			if _param.dequeue then
				dequeueValue()
			end
		end)

		self:onk({ "enqueue", "value" }, function(_param)
			if _param.enqueue then
				enqueueValue(_param.value, _param.valueType)
			end
		end)

		self:onk({ "clear" }, function(_param)
			if _param.clearChanged and _param.clear then
				table.clear(internalMemory)
				self.output.result:unset()
				self.output.size:set("number", 0)
			end
		end)
	end

	function Logic:_depsCreate(_____instance, di, block)
		return _____instance:constructor(block, di:resolve("client/modes/ride/RideToBuildModeSlotScheduler.ts$RideToBuildModeSlotScheduler"))
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)
_object.id = "nvmequeue"
_object.displayName = "Non-Volatile Queue"
_object.description = "A queue storage system where elements remain intact across mode changes and session reconnects."
_object.logic = {
	definition = definition,
	ctor = Logic,
}
_object.modelSource = {
	model = BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", "NVMEQ"),
	category = function()
		return BlockCreation.Categories.memory
	end,
}
_object.search = {
	partialAliases = { "nvmeq", "queue", "nonvolatilequeue", "memory" },
}
_object.limit = 128

local NVMEQueueBlock = _object
return {
	size = size,
	NVMEQueueBlockLogic = Logic,
	NVMEQueueBlock = NVMEQueueBlock,
}