-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local BlockLogic = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blockLogic", "BlockLogic").BlockLogic
local BlockCreation = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "blocks", "BlockCreation").BlockCreation
local _Players = game:GetService("Players")

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local AiChatRF = ReplicatedStorage:WaitForChild("AiChatRF")

local MODEL_URLS = {
	awms = "awms",
	JARVIS  = "https://88149eff-2e77-479b-b96c-b3172e73679d-00-2zp5kys672x9r.spock.replit.dev/chat",
	gemma = "gemma",
}

local definition = {
	inputOrder = { "send", "input", "model" },

	input = {
		send = {
			displayName = "Send",
			types = {
				bool = {
					config = false,
				},
			},
			configHidden = true,
		},

		input = {
			displayName = "Input",
			types = {
				string = {
					config = "",
					placeholder = "Enter prompt",
				},
			},
		},

		model = {
			displayName = "AI Model",
			connectorHidden = true,
			types = {
				enum = {
					config = "awms",
					elementOrder = {
						"awms",
						"JARVIS",
						"gemma",
					},
					elements = {
						awms = {
							displayName = "awms",
							tooltip = "silly",
						},
						JARVIS = {
							displayName = "JARVIS",
							tooltip = "u can be iron man :)",
						},
						gemma = {
							displayName = ":3",
							tooltip = "Not finished",
						},
					},
				},
			},
		},
	},

	output = {
		output = {
			displayName = "Output",
			types = { "string" },
		},
	},
}

local Logic
do
	local super = BlockLogic
	Logic = setmetatable({}, {
		__tostring = function()
			return "Logic"
		end,
		__csymbol = "shared/blocks/blocks/AiBlock.ts$Logic",
		__index = super,
	})
	Logic.__index = Logic

	function Logic.new(...)
		local self = setmetatable({}, Logic)
		return self:constructor(...) or self
	end

	function Logic:constructor(block)
		super.constructor(self, definition, block)

		self._prevSend = false
		self._inFlight = false

		self:onk({ "send", "input", "model" }, function(_param)
			local send = _param.send
			local input = _param.input
			local model = _param.model

			local justPressed = (send == true) and (self._prevSend ~= true)
			self._prevSend = (send == true)

			if not justPressed then return end
			if type(input) ~= "string" or input == "" then
				self.output.output:unset()
				return
			end
			if self._inFlight then return end

			local url = MODEL_URLS[model]
			if not url then
				warn("[AiBlock] Unknown model:", model)
				self.output.output:unset()
				return
			end

			self._inFlight = true

			task.spawn(function()
				local ok, replyOrNil, errOrNil = pcall(function()
					local reply, err = AiChatRF:InvokeServer(input, url)
					return reply, err
				end)

				if not ok then
					warn("[AiBlock] InvokeServer failed:", replyOrNil)
					self.output.output:unset()
				else
					if replyOrNil ~= nil then
						self.output.output:set("string", replyOrNil)
					else
						warn("[AiBlock] AI error:", errOrNil)
						self.output.output:unset()
					end
				end

				self._inFlight = false
			end)
		end)
	end
end

local _object = table.clone(BlockCreation.defaults)
setmetatable(_object, nil)

_object.id = "aiblock"
_object.displayName = "AI Block"
_object.description = "Insert Text, Select Model, Get AI Slop"
_object.search = {
	partialAliases = { "ai", "prompt", "llm" }
}
_object.logic = {
	definition = definition,
	ctor = Logic,
}
_object.limit = 1

local AiBlock = _object

return {
	AiBlockLogic = Logic,
	AiBlock = AiBlock,
}