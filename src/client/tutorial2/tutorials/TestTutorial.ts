import { RunService } from "@rbxts/services";
import { MultiBlockConfigControl } from "client/gui/BlockConfigControls";
import { ConfirmPopup } from "client/gui/popup/ConfirmPopup";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { Element } from "engine/shared/Element";
import { RocketBlocks } from "shared/blocks/blocks/RocketEngineBlocks";
import { BlockManager } from "shared/building/BlockManager";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { PopupController } from "client/gui/PopupController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TutorialDescription } from "client/tutorial2/TutorialDescription";
import type { TutorialStarter } from "client/tutorial2/TutorialStarter";
import type { Component } from "engine/shared/component/Component";

const start = (tutorial: TutorialStarter, firstTime: boolean) => {
	tutorial.$onInjectAuto(
		(
			mainScreen: MainScreenLayout,
			toolController: ToolController,
			buildingMode: BuildingMode,
			popupController: PopupController,
			di: DIContainer,
		) => {
			const tc = tutorial.controller;
			const plot = tutorial.plot;
			const step = tutorial.stepController;

			const gui = tc.gui;
			const tools = buildingMode.tools;

			if (firstTime) {
				gui.progress.setStopAction((stop) => {
					const popup = popupController.showPopup(
						new ConfirmPopup("Are you sure you want to skip the tutorial?", "You DIE if you do that", stop),
					);

					// fix for tutorial fullscreen fade going over popups
					popup.instance.DisplayOrder = gui.instance.DisplayOrder + 1;
				});
			}

			gui.progress.setTitle("Basics tutorial");
			gui.progress.setText("Teaching about basics of the gaming");
			if (true) {
				gui.progress.enableSkip();
			}

			// intro
			step.step((parent, finish) => {
				parent.parent(tc.disableAllInput());
				parent.parentFunc(
					() => toolController.enabledTools.disableAll(),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(gui.createFullScreenFade());
				parent.parent(
					gui
						.createText() //
						.withText("Hi engineer! I am play engineers and i'll teach you how to engineer")
						.withText("Click NEXT to CONTINUE")
						.withText("Or click big red STOP to SKIP the tutorial but then you will DIE")
						.withNext(finish),
				);
			});

			// select build tool
			step.sequence()
				.withOnStart(() => toolController.enabledTools.enableOnly(buildingMode.tools.buildTool))
				.withOnEnd(() => toolController.enabledTools.enableAll())
				.withOnStart(() => buildingMode.tools.buildTool.gui.blockSelector.highlightedBlocks.set(["block"]))
				.withOnEnd(() => buildingMode.tools.buildTool.gui.blockSelector.highlightedBlocks.set([]))

				.conditional({
					condition: () => toolController.selectedTool.get() === buildingMode.tools.buildTool,
					run: (parent) => {
						parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One]));
						parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
						parent.parent(
							gui
								.createText()
								.withPositionAround(mainScreen.hotbar.instance, "up")
								.withText("This is your TOOLBAR")
								.withText("Your TOOLS are here")
								.withText("look CAREFOULY then press BUILD TOOL which is the first one")
								.withText("or key 1 on keyboard or whatevber idk on console"),
						);
					},
				})
				.conditional({
					condition: () =>
						tools.buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"]),
					run: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText()
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("to build you need blocks This is a block list it has blocks")
								.withText("select cateegory 'blocks'")
								.withText("there category bocks"),
						);
					},
				})
				.conditional({
					condition: () => tools.buildTool.selectedBlock.get()?.id === "block",
					run: (parent) => {
						parent.parent(tc.disableAllInput());
						parent.parent(
							gui.createFullScreenFadeWithHoleAround(tools.buildTool.gui.blockSelector.instance),
						);
						parent.parent(
							gui
								.createText()
								.withPositionAround(tools.buildTool.gui.blockSelector.instance, "right")
								.withText("good, NOW")
								.withText("select bock BLOCK"),
						);
					},
				});

			// place block
			step.step((parent, finish) => {
				parent.parentFunc(
					() => toolController.enabledTools.enableOnly(buildingMode.tools.buildTool),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(
					gui
						.createText() //
						.withText("Now using your BUILD TOOL and your BLOCKS.BLOCK, place a BLOCK in the HIGHGLITH"),
				);

				parent.parent(
					plot.processDiff(
						{
							version: 32,
							added: [
								{ uuid: "b0" as BlockUuid, id: "block", location: new CFrame(0, 1.5, 0) },
								{ uuid: "b1" as BlockUuid, id: "block", location: new CFrame(2, 1.5, 0) },
							],
						},
						finish,
					),
				);
			});

			// select delete tool
			step.conditional({
				condition: () => toolController.selectedTool.get() === buildingMode.tools.deleteTool,
				run: (parent) => {
					parent.parentFunc(
						() =>
							toolController.enabledTools.enableOnly(
								buildingMode.tools.buildTool,
								buildingMode.tools.deleteTool,
							),
						() => toolController.enabledTools.enableAll(),
					);
					parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One, Enum.KeyCode.Three]));
					parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
					parent.parent(plot.disableBuilding());
					parent.parent(
						gui
							.createText() //
							.withText("good. NO, WRONG. you are WRONG. you should NOT HAVE placed that BLOCK.")
							.withText("lets' DESTROY IT")
							.withText("SELECT delete TOOL")
							.withText("it deletes BLOCKS but not your debt"),
					);
				},
			});

			// delete block
			step.step((parent, finish) => {
				parent.parentFunc(
					() =>
						toolController.enabledTools.enableOnly(
							buildingMode.tools.buildTool,
							buildingMode.tools.deleteTool,
						),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(plot.disableBuilding());
				parent.parent(
					gui
						.createText() //
						.withText("destroy the IMPOSTER")
						.withText("(hes highlighted red, you see)")
						.withText("(sus or something)")
						.withText("(delete him before he vents)"),
				);

				parent.parent(plot.processDiff({ version: 32, removed: ["b0" as BlockUuid] }, finish));
			});

			// place rocket block
			step.step((parent, finish) => {
				parent.parentFunc(
					() =>
						toolController.enabledTools.enableOnly(
							buildingMode.tools.buildTool,
							buildingMode.tools.deleteTool,
						),
					() => toolController.enabledTools.enableAll(),
				);
				parent.parent(plot.disableDeleting());
				parent.parent(
					gui
						.createText() //
						.withText("okay now the ROCKET, it makes FLY"),
				);

				parent.parent(
					plot.processDiff(
						{
							version: 32,
							added: [
								{
									uuid: "rocket0" as BlockUuid,
									id: "smallrocketengine",
									location: new CFrame(5, 1.5, 0),
								},
							],
						},
						finish,
					),
				);
			});

			// select config tool
			step.conditional({
				condition: () => toolController.selectedTool.get() === buildingMode.tools.configTool,
				run: (parent) => {
					parent.parentFunc(
						() =>
							toolController.enabledTools.enableOnly(
								buildingMode.tools.buildTool,
								buildingMode.tools.deleteTool,
								buildingMode.tools.configTool,
							),
						() => toolController.enabledTools.enableAll(),
					);
					parent.parent(tc.disableAllInputExcept([Enum.KeyCode.One, Enum.KeyCode.Three, Enum.KeyCode.Four]));
					parent.parent(gui.createFullScreenFadeWithHoleAround(mainScreen.hotbar.instance, Vector2.zero));
					parent.parent(plot.disableBuilding());
					parent.parent(plot.disableDeleting());
					parent.parent(
						gui
							.createText() //
							.withText("now THIRD TOOL is the CONFIG TOOL"),
					);
				},
			});

			/** @deprecated */
			const createConfigExample = (parent: Component) => {
				const exampleGui = Element.create(
					"ScreenGui",
					{
						Parent: gui.instance,
					},
					{
						frame: Element.create(
							"Frame",
							{
								Position: new UDim2(0.3, 0, 0.033, 0),
								Size: new UDim2(0, 324, 0, 600),
								BackgroundColor3: Color3.fromRGB(1, 4, 9),
								BackgroundTransparency: 0.5,
								Interactable: false,
							},
							{
								padding: Element.create("UIPadding", {
									PaddingBottom: new UDim(0, 5),
									PaddingLeft: new UDim(0, 5),
									PaddingRight: new UDim(0, 2),
									PaddingTop: new UDim(0, 5),
								}),
								list: Element.create("UIListLayout", { Padding: new UDim(0, 5) }),
							},
						),
					},
				);

				const configPreview = di.resolveForeignClass(MultiBlockConfigControl, [
					exampleGui.frame,
					RocketBlocks[0].logic!.definition.input,
					{
						["rocket0" as BlockUuid]: {
							thrust: {
								controlConfig: {
									enabled: true,
									mode: { type: "instant", instant: { mode: "onRelease" } },
									keys: [
										{ key: "R", value: 100 },
										{ key: "F", value: 0 },
									],
								},
							},
						},
					} as never,
					undefined,
					new Map(),
				]);
				parent.parent(configPreview);
				parent.parent(new ScaledScreenGui(exampleGui));

				return $tuple(configPreview, exampleGui);
			};

			// config tool explanation
			step.sequence()
				.withOnStart(() =>
					toolController.enabledTools.enableOnly(
						buildingMode.tools.buildTool,
						buildingMode.tools.deleteTool,
						buildingMode.tools.configTool,
					),
				)
				.withOnEnd(() => toolController.enabledTools.enableAll())
				.withOnStart((parent) => parent.parent(plot.disableBuilding()))
				.withOnStart((parent) => parent.parent(plot.disableDeleting()))
				.withOnStart(() => (buildingMode.tools.configTool.gui.configContainer.instance.Interactable = false))
				.withOnEnd(() => (buildingMode.tools.configTool.gui.configContainer.instance.Interactable = true))
				.conditional({
					condition: () => {
						const sel = buildingMode.tools.configTool.selected.get();
						return sel.size() === 1 && BlockManager.manager.uuid.get(sel.first()!) === "rocket0";
					},
					run: (parent) => {
						parent.event.subscribeRegistration(() => plot.plot.highlight(["rocket0" as BlockUuid]));
						parent.parent(
							gui
								.createText() //
								.withText("ok now i teach you the CONFIGURATION WINDOW")
								.withText("SELECT ROCKET BLOCK"),
						);
					},
				})
				.step((parent, finish) => {
					parent.parent(
						gui.createFullScreenFadeWithHoleAround(
							buildingMode.tools.configTool.gui.configContainer.instance,
						),
					);

					parent.parent(
						gui
							.createText() //
							.withText("ok now i teach you the CONFIGURATION WINDOW")
							.withText("THIS is CONFIGURATION WINDOW")
							.withText("it makes CONFIGURATION WINDOW")
							.withText("yiu CONFIGURE in this WINDOW")
							.withText("-the blocks")
							.withNext(finish),
					);
				})
				.step((parent, finish) => {
					parent.parent(
						gui.createFullScreenFadeWithHoleAround(
							buildingMode.tools.configTool.gui.configContainer.instance.FindFirstChild(
								"MultiKeys",
								true,
							) as GuiObject,
						),
					);

					parent.parent(
						gui
							.createText() //
							.withText("this configurable thing is KEY control")
							.withNext(finish),
					);
				})
				.step((parent, finish) => {
					parent.parent(
						gui.createFullScreenFadeWithHoleAround(
							buildingMode.tools.configTool.gui.configContainer.instance
								.FindFirstChild("MultiKeys", true)!
								.FindFirstChild("Template", true)!
								.FindFirstChild("Button", true) as GuiObject,
							new Vector2(4, 4),
						),
					);

					parent.parent(
						gui
							.createText() //
							.withText("look this configurable thing is KEY control")
							.withText("when you presst this key...")
							.withNext(finish),
					);
				})
				.step((parent, finish) => {
					parent.parent(
						gui.createFullScreenFadeWithHoleAround(
							buildingMode.tools.configTool.gui.configContainer.instance
								.FindFirstChild("MultiKeys", true)!
								.FindFirstChild("Template", true)!
								.FindFirstChild("Number", true) as GuiObject,
							new Vector2(4, 4),
						),
					);

					parent.parent(
						gui
							.createText() //
							.withText("look this configurable thing is KEY control")
							.withText("when you presst this key the number MOVE to the number")
							.withNext(finish),
					);
				})
				.step((parent, finish) => {
					buildingMode.tools.configTool.gui.configContainer.instance.Interactable = true;
					parent.parent(
						gui.createFullScreenFadeWithHoleAround(
							buildingMode.tools.configTool.gui.configContainer.instance.FindFirstChild(
								"MultiKeys",
								true,
							) as GuiObject,
						),
					);

					parent.parent(
						gui
							.createText() //
							.withText("we'll use this to control our plane thrust")
							.withText("so configure")
							.withText("key R = 100%")
							.withText("key F = 0%")
							.withText("// TODO: doesn't work on mobile probably"),
					);

					parent.parent(
						plot.processDiff(
							{
								version: 32,
								configChanged: {
									["rocket0" as BlockUuid]: {
										thrust: {
											controlConfig: {
												enabled: true,
												keys: [
													{ key: "R", value: 100 },
													{ key: "F", value: 0 },
												],
											},
										},
									},
								},
							},
							finish,
						),
					);
				})
				.step((parent, finish) => {
					parent.parent(
						gui.createFullScreenFadeWithHoleAround(
							buildingMode.tools.configTool.gui.configContainer.instance //
								.FindFirstChild("Smooth change", true) as GuiObject,
						),
					);

					parent.parent(
						plot.processDiff(
							{
								version: 32,
								configChanged: {
									["rocket0" as BlockUuid]: {
										thrust: {
											controlConfig: {
												enabled: true,
												mode: {
													type: "instant",
													instant: { mode: "onRelease" },
												},
												keys: [
													{ key: "R", value: 100 },
													{ key: "F", value: 0 },
												],
											},
										},
									},
								},
							},
							finish,
						),
					);

					parent.parent(
						gui
							.createText() //
							.withText("this thing controls whether number goes smoothly or instant")
							.withText("disable IT"),
					);
				});

			//

			// end
			step.step((parent, finish) => {
				parent.parent(gui.createFullScreenFade());
				parent.parent(
					gui
						.createText() //
						.withText("damn good work")
						.withNext(finish),
				);
			});

			tutorial.start();
		},
	);
};

export const TestTutorial = {
	name: "Basics",
	description: "Teaching basics of the game by building a simple plane",
	start,
} satisfies TutorialDescription;
