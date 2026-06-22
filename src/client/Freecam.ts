import { ContextActionService, Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { Action } from "engine/client/Action";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import { ObservableValue } from "engine/shared/event/ObservableValue";

const pi = math.pi;
const abs = math.abs;
const clamp = math.clamp;
const exp = math.exp;
const sign = math.sign;

type GameSettings = {
	readonly ControlMode: Enum.ControlMode;
	readonly ComputerMovementMode: Enum.ComputerMovementMode;
};
const GameSettings = (UserSettings() as unknown as { GameSettings: GameSettings }).GameSettings;

let Player = Players.LocalPlayer;
if (!Player) {
	Players.GetPropertyChangedSignal("LocalPlayer").Wait();
	Player = Players.LocalPlayer;
}

let Camera = Workspace.CurrentCamera!;
Workspace.GetPropertyChangedSignal("CurrentCamera").Connect(function () {
	const newCamera = Workspace.CurrentCamera;
	if (newCamera) {
		Camera = newCamera;
	}
});

let FFlagUserExitFreecamBreaksWithShiftlock: boolean;
{
	const [success, result] = pcall(function () {
		return UserSettings().IsUserFeatureEnabled("UserExitFreecamBreaksWithShiftlock");
	});
	FFlagUserExitFreecamBreaksWithShiftlock = success && result;
}

const INPUT_PRIORITY = Enum.ContextActionPriority.High.Value;

const NAV_GAIN = Vector3.one.mul(64);
let freecamSpeed = 1;
class VelocitySpring {
	p = Vector3.zero;
	v = Vector3.zero;

	Update(dt: number, goal: Vector3) {
		const VEL_STIFFNESS = 5;

		const f = VEL_STIFFNESS * 2 * pi;
		const p0 = this.p;
		const v0 = this.v;

		const offset = goal.sub(p0);
		const decay = exp(-f * dt);

		const p1 = goal.add(
			v0
				.mul(dt)
				.sub(offset.mul(f * dt + 1))
				.mul(decay),
		);
		const v1 = offset.mul(f).sub(v0).mul(f).mul(dt).add(v0).mul(decay);

		this.p = p1;
		this.v = v1;

		return p1;
	}

	Reset(pos: Vector3) {
		this.p = pos;
		this.v = pos.mul(0);
	}
}

let cameraPos = new Vector3();
const velSpring = new VelocitySpring();

namespace Input {
	const K_CURVATURE = 2.0;
	const K_DEADZONE = 0.15;
	function fCurve(x: number) {
		return (exp(K_CURVATURE * x) - 1) / (exp(K_CURVATURE) - 1);
	}
	function fDeadzone(x: number) {
		return fCurve((x - K_DEADZONE) / (1 - K_DEADZONE));
	}
	function thumbstickCurve(x: number) {
		return sign(x) * clamp(fDeadzone(abs(x)), 0, 1);
	}

	const _gamepad = {
		ButtonX: 0,
		ButtonY: 0,
		DPadDown: 0,
		DPadUp: 0,
		ButtonL2: 0,
		ButtonR2: 0,
		Thumbstick1: new Vector2(),
		Thumbstick2: new Vector2(),
	};
	const gamepad: typeof _gamepad & { [k in KeyCode]?: number | Vector2 | Vector3 } = _gamepad;

	const _keyboard = {
		W: 0,
		A: 0,
		S: 0,
		D: 0,
		E: 0,
		Q: 0,
		U: 0,
		H: 0,
		J: 0,
		K: 0,
		I: 0,
		Y: 0,
		Space: 0,
		Up: 0,
		Down: 0,
		LeftShift: 0,
		RightShift: 0,
	};
	const keyboard: typeof _keyboard & { [k in KeyCode]?: number } = _keyboard;

	const _mouse = {
		Delta: new Vector2(),
		MouseWheel: 0,
	};
	const mouse: typeof _mouse & { [k in Enum.UserInputType["Name"]]?: number } = _mouse;

	const NAV_GAMEPAD_SPEED = new Vector3(1, 1, 1);
	const NAV_KEYBOARD_SPEED = new Vector3(1, 1, 1);
	const NAV_ADJ_SPEED = 0.75;
	const NAV_SHIFT_MUL = 0.25;

	let navSpeed = 1;

	let base = Vector3.zero;
	let capture: SignalConnection | undefined;

	export function Vel(dt: number) {
		navSpeed = clamp(navSpeed + dt * (keyboard.Up - keyboard.Down) * NAV_ADJ_SPEED, 0.01, 4);

		const kGamepad = new Vector3(
			thumbstickCurve(gamepad.Thumbstick1.X),
			thumbstickCurve(gamepad.ButtonR2) - thumbstickCurve(gamepad.ButtonL2),
			thumbstickCurve(-gamepad.Thumbstick1.Y),
		).mul(NAV_GAMEPAD_SPEED);

		const kKeyboard = new Vector3(
			keyboard.D - keyboard.A + keyboard.K - keyboard.H,
			keyboard.E - keyboard.Q + keyboard.I - keyboard.Y + keyboard.Space,
			keyboard.S - keyboard.W + keyboard.J - keyboard.U,
		).mul(NAV_KEYBOARD_SPEED);

		const shift =
			UserInputService.IsKeyDown(Enum.KeyCode.LeftShift) || UserInputService.IsKeyDown(Enum.KeyCode.RightShift);

		return base
			.add(kGamepad)
			.add(kKeyboard)
			.mul(navSpeed * (shift ? NAV_SHIFT_MUL : 1) * freecamSpeed);
	}

	function Keypress(action: string, state: Enum.UserInputState, input: InputObject) {
		keyboard[input.KeyCode.Name] = state === Enum.UserInputState.Begin ? 1 : 0;
		return Enum.ContextActionResult.Sink;
	}
	function GpButton(action: string, state: Enum.UserInputState, input: InputObject) {
		gamepad[input.KeyCode.Name] = (state === Enum.UserInputState.Begin ? 1 : 0) as never;
		return Enum.ContextActionResult.Sink;
	}
	function MousePan(action: string, state: Enum.UserInputState, input: InputObject) {
		const delta = input.Delta;
		mouse.Delta = new Vector2(-delta.Y, -delta.X);
		return Enum.ContextActionResult.Sink;
	}
	function Thumb(action: string, state: Enum.UserInputState, input: InputObject) {
		gamepad[input.KeyCode.Name] = input.Position as never;
		return Enum.ContextActionResult.Sink;
	}
	function Trigger(action: string, state: Enum.UserInputState, input: InputObject) {
		gamepad[input.KeyCode.Name] = input.Position.Z as never;
		return Enum.ContextActionResult.Sink;
	}
	function MouseWheel(action: string, state: Enum.UserInputState, input: InputObject) {
		mouse[input.UserInputType.Name] = -input.Position.Z;
		return Enum.ContextActionResult.Sink;
	}

	function Zero(t: Record<string, number | Vector2 | Vector3>) {
		for (const [k, v] of pairs(t)) {
			if (typeIs(v, "number")) {
				t[k] = v * 0;
			} else if (typeIs(v, "Vector2")) {
				t[k] = v.mul(0);
			} else if (typeIs(v, "Vector3")) {
				t[k] = v.mul(0);
			}
		}
	}

	export function StartCapture() {
		ContextActionService.BindActionAtPriority(
			"FreecamKeyboard",
			Keypress,
			false,
			INPUT_PRIORITY,
			Enum.KeyCode.W,
			Enum.KeyCode.U,
			Enum.KeyCode.A,
			Enum.KeyCode.H,
			Enum.KeyCode.S,
			Enum.KeyCode.J,
			Enum.KeyCode.D,
			Enum.KeyCode.K,
			Enum.KeyCode.E,
			Enum.KeyCode.I,
			Enum.KeyCode.Q,
			Enum.KeyCode.Y,
			Enum.KeyCode.Space,
			Enum.KeyCode.Up,
			Enum.KeyCode.Down,
		);
		ContextActionService.BindActionAtPriority(
			"FreecamMousePan",
			MousePan,
			false,
			INPUT_PRIORITY,
			Enum.UserInputType.MouseMovement,
		);
		ContextActionService.BindActionAtPriority(
			"FreecamMouseWheel",
			MouseWheel,
			false,
			INPUT_PRIORITY,
			Enum.UserInputType.MouseWheel,
		);
		ContextActionService.BindActionAtPriority(
			"FreecamGamepadButton",
			GpButton,
			false,
			INPUT_PRIORITY,
			Enum.KeyCode.ButtonX,
			Enum.KeyCode.ButtonY,
		);
		ContextActionService.BindActionAtPriority(
			"FreecamGamepadTrigger",
			Trigger,
			false,
			INPUT_PRIORITY,
			Enum.KeyCode.ButtonR2,
			Enum.KeyCode.ButtonL2,
		);
		ContextActionService.BindActionAtPriority(
			"FreecamGamepadThumbstick",
			Thumb,
			false,
			INPUT_PRIORITY,
			Enum.KeyCode.Thumbstick1,
			Enum.KeyCode.Thumbstick2,
		);

		const t = task.spawn(() => {
			const h = LocalPlayer.humanoid.get()!;
			const pos = h.RootPart!.GetPivot();

			const controls = LocalPlayer.getPlayerModule().GetControls();
			while (true as boolean) {
				task.wait();
				base = controls.GetMoveVector();
				h.RootPart?.PivotTo(pos);
			}
		});
		capture = {
			Disconnect() {
				task.cancel(t);
			},
		};
	}

	export function StopCapture() {
		capture?.Disconnect();
		navSpeed = 1;
		Zero(gamepad);
		Zero(keyboard);
		Zero(mouse);
		ContextActionService.UnbindAction("FreecamKeyboard");
		ContextActionService.UnbindAction("FreecamMousePan");
		ContextActionService.UnbindAction("FreecamMouseWheel");
		ContextActionService.UnbindAction("FreecamGamepadButton");
		ContextActionService.UnbindAction("FreecamGamepadTrigger");
		ContextActionService.UnbindAction("FreecamGamepadThumbstick");
	}
}

function StepFreecam(dt: number) {
	const vel = velSpring.Update(dt, Input.Vel(dt));

	const cameraCFrame = new CFrame(cameraPos) //
		.mul(Camera.CFrame.Rotation)
		.mul(new CFrame(vel.mul(NAV_GAIN).mul(dt)));
	cameraPos = cameraCFrame.Position;

	const bounds = Freecam.bounds.get();
	if (bounds) {
		const min = bounds.size.div(-2);
		const max = bounds.size.div(2);

		let objCameraPos = bounds.center.PointToObjectSpace(cameraPos);
		objCameraPos = new Vector3(
			math.clamp(objCameraPos.X, min.X, max.X),
			math.clamp(objCameraPos.Y, min.Y, max.Y),
			math.clamp(objCameraPos.Z, min.Z, max.Z),
		);
		cameraPos = bounds.center.PointToWorldSpace(objCameraPos);
	}

	Camera.CFrame = cameraCFrame;
	Camera.Focus = cameraCFrame;
}

function CheckMouseLockAvailability() {
	const devAllowsMouseLock = Players.LocalPlayer.DevEnableMouseLock;
	const devMovementModeIsScriptable =
		Players.LocalPlayer.DevComputerMovementMode === Enum.DevComputerMovementMode.Scriptable;
	const userHasMouseLockModeEnabled = GameSettings.ControlMode === Enum.ControlMode.MouseLockSwitch;
	const userHasClickToMoveEnabled = GameSettings.ComputerMovementMode === Enum.ComputerMovementMode.ClickToMove;
	const MouseLockAvailable =
		devAllowsMouseLock && userHasMouseLockModeEnabled && !userHasClickToMoveEnabled && !devMovementModeIsScriptable;

	return MouseLockAvailable;
}

namespace PlayerState {
	type current = {
		cameraType: Enum.CameraType;
		cameraCFrame: CFrame;
		cameraFocus: CFrame;
		mouseBehavior: Enum.MouseBehavior;
	};
	let current: current | undefined;

	export function Push() {
		current = {
			cameraType: Camera.CameraType,
			cameraCFrame: Camera.CFrame,
			cameraFocus: Camera.Focus,
			mouseBehavior:
				FFlagUserExitFreecamBreaksWithShiftlock && CheckMouseLockAvailability()
					? Enum.MouseBehavior.Default
					: UserInputService.MouseBehavior,
		};

		Camera.CameraType = Enum.CameraType.Custom;
		UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
	}
	export function Pop() {
		if (!current) return;

		Camera.CameraType = current.cameraType;
		Camera.CFrame = current.cameraCFrame;
		Camera.Focus = current.cameraFocus;
		UserInputService.MouseBehavior = current.mouseBehavior;

		current = undefined;
	}
}

export namespace Freecam {
	export type Bounds = { readonly center: CFrame; readonly size: Vector3 };

	function start() {
		if (freecaming.get()) return;
		freecaming.set(true);
		(LocalPlayer.getPlayerModule().GetCameras() as unknown as { tppaused: boolean }).tppaused = true;

		const cameraCFrame = Camera.CFrame;
		cameraPos = cameraCFrame.Position;

		velSpring.Reset(new Vector3());

		PlayerState.Push();
		RunService.BindToRenderStep("Freecam", Enum.RenderPriority.Camera.Value, StepFreecam);
		Input.StartCapture();
	}
	function stop() {
		if (!freecaming.get()) return;
		freecaming.set(false);
		(LocalPlayer.getPlayerModule().GetCameras() as unknown as { tppaused: boolean }).tppaused = false;

		Input.StopCapture();
		RunService.UnbindFromRenderStep("Freecam");
		PlayerState.Pop();
	}

	const freecaming = new ObservableValue(false);
	export const isFreecaming = freecaming.asReadonly();

	export const bounds = new OverlayValueStorage<Freecam.Bounds | undefined>(undefined);
	export const toggle = new Action(() => {
		if (freecaming.get()) stop();
		else start();
	});
	toggle.enable();

	toggle.canExecute.subscribe((can) => {
		if (!can && isFreecaming.get()) {
			stop();
		}
	});

	export function setSpeed(value: number) {
		freecamSpeed = value;
	}
}
