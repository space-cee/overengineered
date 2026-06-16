import { Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";

export class RockAndBushRotationController extends HostedService {
	private readonly objectNames: readonly string[] = ["Rock", "Bush"];
	constructor() {
		super();

		this.onEnable(() => {
			for (const obj of Workspace.GetDescendants()) {
				if (!obj.IsA("Model") || !this.objectNames.includes(obj.Name)) continue;
				this.randomRotation(obj);
			}
		});
	}

	randomRotation(model: Model) {
		if (!model.PrimaryPart) {
			const main = model.FindFirstChild("Main");
			const fallback = model.GetChildren().find((child) => child.IsA("BasePart"));

			if (main?.IsA("BasePart")) {
				model.PrimaryPart = main;
			} else if (fallback?.IsA("BasePart")) {
				model.PrimaryPart = fallback;
			}
		}
		if (!model.PrimaryPart) {
			warn(
				`[RockAndBushRotationController] model missing BasePart PrimaryPart: ${model.Name} (${model.GetFullName()})`,
			);
			return;
		}
		const [xRot, yRot, zRot] = [
			//
			math.random(-360, 360),
			math.random(-360, 360),
			math.random(-360, 360),
		];
		const rotation = CFrame.Angles(math.rad(xRot), math.rad(yRot), math.rad(zRot));
		model.PrimaryPart.CFrame = model.PrimaryPart.CFrame.mul(rotation);
	}
}
