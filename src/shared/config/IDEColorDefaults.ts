import { ReplicatedStorage } from "@rbxts/services";

// PlayerConfig loads this before player settings can be applied to the highlighter.
// Snapshot the theme's initial colors: getColor() becomes mutable once the IDE opens.
const theme = require(ReplicatedStorage.Modules.Highlighter.WaitForChild("theme") as ModuleScript) as {
	getColor: (token: string) => Color3 | undefined;
};

const tokenDefault = (token: string, fallback = "iden"): Color4 => {
	const color = theme.getColor(token) ?? theme.getColor(fallback);
	assert(color !== undefined, `Missing Highlighter theme default: ${token} / ${fallback}`);
	return { color, alpha: 1 };
};

export const IDEColorDefaults: IDEColorConfiguration = {
	declaration: tokenDefault("declaration", "keyword"),
	functionDeclaration: tokenDefault("functionDeclaration", "builtin"),
	property: tokenDefault("property"),
	bracket1: tokenDefault("bracket1", "operator"),
	bracket2: tokenDefault("bracket2", "operator"),
	bracket3: tokenDefault("bracket3", "operator"),
	lineNumbers: tokenDefault("lineNumbers", "comment"),
	iden: tokenDefault("iden"),
	keyword: tokenDefault("keyword"),
	builtin: tokenDefault("builtin"),
	string: tokenDefault("string"),
	number: tokenDefault("number"),
	comment: tokenDefault("comment"),
	operator: tokenDefault("operator"),
	custom: tokenDefault("custom"),
};
