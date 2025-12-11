import { NewBasicPlaneTutorialDiffs } from "client/tutorial/tutorials/NewBasicPlaneTutorial.diff";
import { InputController } from "engine/client/InputController";
import type { BuildingMode } from "client/modes/build/BuildingMode";
import type { ToolController } from "client/tools/ToolController";
import type { TutorialController, TutorialDescriber, TutorialRunnerPartList } from "client/tutorial/TutorialController";

@injectable
export class NewBasicPlaneTutorial implements TutorialDescriber {
	readonly name = "Basics/plane";

	constructor(
		@inject private readonly buildingMode: BuildingMode,
		@inject private readonly toolController: ToolController,
	) {}

	create(t: TutorialController): TutorialRunnerPartList {
		const { saveVersion, diffs } = NewBasicPlaneTutorialDiffs;
		const toolController = this.toolController;
		const editTool = this.buildingMode.tools.editTool;

		return [
			() => [
				t.funcPart(() => {
					toolController.enabledTools.disableAll();
					this.buildingMode.switchTutorialMode(true);

					t.onDestroy(() => {
						toolController.enabledTools.enableAll();
						editTool.enabledModes.enableAll();
						this.buildingMode.switchTutorialMode(false);
					});
				}),
				t.partNextButton(),
				t.partText(
					"Welcome to",
					" ",
					"OverEngineered!", // <--------- STUPID FUCKIN GAME ™
					"!",
					"\n",
					"This tutorial will teach you how to build a basic plane.",
				),
				t.translatedHintsPart([`Hint: Press "next" to advance`]),
				t.translatedHintsPart([`Hint: You can play this tutorial again.\nLook for it in the settings.`]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.base, saveVersion),
				t.partText("First, let's build the frame for your plane."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Beam 1x4"`],
					["Place all the highlighted blocks"],
					InputController.inputType.get() === "Desktop"
						? ["Hint: Hold shift to build multiple blocks"]
						: ['Hint: Press "++" to build multiple blocks'],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.engineAndSeat, saveVersion),
				t.partText(
					"Now let's place the engine and the seat.\nThe engine will power your plane and the seat will provide a comfortable flight!",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select and place "Small Rocket Engine"`],
					[`Select and place "Driver Seat"`],
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.basicWings, saveVersion),
				t.partText("Well done! Now place some wings."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select and place "Corner Wing 1x4"`],
					[`Select and place "Wing 1x4"`],
				),
			],
			() => [
				t.funcPart(() => {
					toolController.enabledTools.enableOnly(this.buildingMode.tools.editTool);
					editTool.enabledModes.enableOnly("Move");
				}),
				t.processDiff(diffs.moveAll, saveVersion),
				t.partText("Before the next step, let's move your creation a bit higher."),
				t.translatedHintsPart(
					["Select the edit tool"],
					[`Press "Structure Selection" on the right`],
					["Press anywhere on your creation"],
					[`Press "Move" on the bottom`],
					[`Drag the green arrow (the one on the top)`],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.servo, saveVersion),
				t.partText(
					"It's time to place the servos.\nThese are used to precisely rotate something to an angle.\nWe're going to control many things using these.",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Movement"`],
					[`Select "Motor"`],
					[`Select "Servo"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.deleteTool)),
				t.processDiff(diffs.removeExtraServo, saveVersion),
				t.partText("Oh, what's that? Seems that we placed an extra servo!\nLet's remove it."),
				t.translatedHintsPart(["Select the delete tool"], ["Remove the highlighted block"], [""]),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.controlWings, saveVersion),
				t.partText("Alright, let's place the rest of the wings."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Wings"`],
					[`Select "Wing 1x2"`],
					["Place all the highlighted blocks"],
					[""],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.prepareForWheels, saveVersion),
				t.partText(
					"All your plane lacks now is wheels.\nBut how do we connect them?\nUsing bearings and hinges of course!",
				),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select and place "Wedge 1x1" on the tail`],
					[`Select and place "Bearing Shaft" under the wedges`],
					[`Select and place "Small Hinge" on the front servo`],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.buildTool)),
				t.processDiff(diffs.placeWheels, saveVersion),
				t.partText("Almost done! Now just place wheels and we're done with building."),
				t.translatedHintsPart(
					["Select the build tool"],
					[`Select "Old Wheel"`],
					["Place all the highlighted old fashioned wheels"],
					[""],
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					`Great, now all that remains is to set everything up. Let's begin with base configuration first...`,
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.configTool)),
				t.processDiff(diffs.configureAllServos, saveVersion),
				t.partText("Let's configure these servos!"),
				t.translatedHintsPart(
					["Select the configuration tool"],
					[`Select every servo`],
					[""],
					[`Take a close look at the menu`],
					["Don't change anything yet"],
					[`if you did then don't worry, we'll get to that`],
					[`In this menu you can configure things to your liking`],
					[""],
					[`Select number field (left of red trashbin button)`],
					[`Select the first field and enter "15"`],
					[`Select the second field and enter "-15"`],
					[""],
					[`If you deleted a field use '+' button to add it back`],
					[`Don't forget to set S and W keys back`],
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					`Very good! You just configured your first blocks.\nRemember: a lot of the blocks are configurable.`,
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.configTool)),
				t.processDiff(diffs.configureRoll, saveVersion),
				t.partText(
					"Set up the servos that are used to control horizontal tilt (roll) of your plane.\n These are located just behind your front main pair of wings.",
				),
				t.hintsPart(
					"Select the config tool",
					"Select two servo motors behind your front wings",
					"Press 'R' and replace it with 'D'",
					"Press 'F' and replace it with 'A'",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.configTool)),
				t.processDiff(diffs.configurePitch, saveVersion),
				t.partText(
					`Great. Now we need to adjust the back wings.\nThey are responsible for the forward tilt (pitch)`,
				),
				t.hintsPart(
					"Select the config tool",
					"",
					"Select the tail servo on the left side of your plane",
					"Replace first key 'R' with key 'W'",
					"Replace second key 'F' with key 'S'",
					"",
					"Select the tail servo on the right side of your plane",
					"Replace first key 'R' with key 'S'",
					"Replace second key 'F' with key 'W'",
					"",
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText("We're almost done! Very soon you'll have your plane flying."),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.configTool)),
				t.processDiff(diffs.configureYaw, saveVersion),
				t.partText(
					"Time to configure the last two servos. One is on the back (on top of your tail) and another right under the nose of your plane",
				),
				t.translatedHintsPart(
					["Select the config tool"],
					[`Select servomotors`],
					["Replace first key with 'A'"],
					["Replace second key with 'D'"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.enableOnly(this.buildingMode.tools.configTool)),
				t.processDiff(diffs.configureEngine, saveVersion),
				t.partText("And, finally, adjust the engine controls"),
				t.translatedHintsPart(
					["Select the config tool"],
					["Select the small rocket engine"],
					["Replace first key with 'R'"],
					["Replace second key with 'F'"],
				),
			],

			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					`Your plane is ready! When you're ready, just press the triangle button on the top of your screen.`,
				),
			],
			() => [
				t.funcPart(() => toolController.enabledTools.disableAll()),
				t.partNextButton(),
				t.partText(
					`This is the last message. You can replay this tutorial any moment, just go to the settings (next to the play button)\nGood luck!`,
				),
			],
		];
	}
}
