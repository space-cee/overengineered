import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	outputOrder: [
		"direction",
		"angle",
		"position3d",
		"middleClick",
		"position",
		"velocity",
		"rightClick",
		"angle3d",
		"leftClick",
	],
	input: {},
	output: {
		direction: {
			displayName: "3D Direction",
			unit: "Vector3 unit",
			types: ["vector3"],
		},
		angle: {
			displayName: "Angle around the center",
			unit: "Degrees",
			types: ["number"],
		},
		position3d: {
			displayName: "3D Position",
			unit: "Vector3 Global position",
			types: ["vector3"],
		},
		middleClick: {
			displayName: "Mouse Wheel Click",
			types: ["bool"],
		},
		position: {
			displayName: "Position",
			unit: "Vector2 0-1",
			types: ["vector3"],
		},
		velocity: {
			displayName: "Velocity",
			unit: "Pixels/Sec",
			types: ["vector3"],
		},
		rightClick: {
			displayName: "Right Click",
			types: ["bool"],
		},
		angle3d: {
			displayName: "3D Angle of direction",
			unit: "Radians",
			types: ["vector3"],
		},
		leftClick: {
			displayName: "Left Click",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as MouseSensorBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		let wheel = 0;
		let lastMousePos = UserInputService.GetMouseLocation();

		if (RunService.IsClient()) {
			this.event.subscribe(UserInputService.InputChanged, (input) => {
				if (input.UserInputType === Enum.UserInputType.MouseWheel) {
					wheel = input.Position.Z;
				}
			});
		}

		this.event.subscribe(RunService.PostSimulation, (dt) => {
			const mousePos = UserInputService.GetMouseLocation();
			const relaPos = mousePos.div(Workspace.CurrentCamera!.ViewportSize);

			this.output.position.set("vector3", new Vector3(relaPos.X, relaPos.Y, wheel));
			wheel = 0;

			const deltaPos = mousePos.sub(lastMousePos);
			const mouseVelocity = dt > 0 ? deltaPos.div(dt) : Vector2.zero;
			lastMousePos = mousePos;
			this.output.velocity.set("vector3", new Vector3(mouseVelocity.X, mouseVelocity.Y, 0));

			this.output.angle.set("number", math.deg(math.atan2(-(relaPos.Y - 0.5), relaPos.X - 0.5)));

			const camera = Workspace.CurrentCamera;
			if (camera) {
				const ray = camera.ViewportPointToRay(mousePos.X, mousePos.Y);
				const [x, y, z] = CFrame.lookAt(Vector3.zero, ray.Direction).ToOrientation();

				this.output.direction.set("vector3", ray.Direction);
				this.output.angle3d.set("vector3", new Vector3(x, y, z));
				this.output.position3d.set(
					"vector3",
					Players.LocalPlayer.GetMouse()!.Hit.Position.sub(new Vector3(0, GameDefinitions.HEIGHT_OFFSET, 0)),
				);
			}

			const mb1 = UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1);
			const mb2 = UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton2);
			const mb3 = UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton3);
			this.output.leftClick.set("bool", mb1);
			this.output.rightClick.set("bool", mb2);
			this.output.middleClick.set("bool", mb3);
		});
	}
}

export const MouseSensorBlock = {
	...BlockCreation.defaults,
	id: "mousesensor",
	displayName: "Mouse Sensor",
	description: "Returns some data about the mouse cursor",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
