/* eslint-disable no-constant-condition */
import { Workspace, RunService } from "@rbxts/services";

const ws = Workspace as Workspace & {
	Map: Folder & {
		Unloadables: Folder & {
			Moon: Folder & {
				["The Moon"]: Model & {
					["The Moon (PBR)"]: MeshPart;
				};
			};
		};
	};
};

const moon = ws.Map.Unloadables.Moon["The Moon"]["The Moon (PBR)"];
const gravityRange = 40000;
const gravityRangeSq = gravityRange * gravityRange;

const gravityStrength = 50; // tuning constant
const massCap = 200;

const tracked = new Map<BasePart, VectorForce>();

function setupRoot(root: BasePart): void {
	if (tracked.has(root)) {
		return;
	}

	let force = root.FindFirstChild("GravityForce") as VectorForce | undefined;
	if (force) {
		force.Destroy();
	}

	let attachment = root.FindFirstChild("GravityAttachment") as Attachment | undefined;
	if (attachment) {
		attachment.Destroy();
	}

	attachment = new Instance("Attachment");
	attachment.Name = "GravityAttachment";
	attachment.Parent = root;

	force = new Instance("VectorForce");
	force.Name = "GravityForce";
	force.Attachment0 = attachment;
	force.RelativeTo = Enum.ActuatorRelativeTo.World;
	force.ApplyAtCenterOfMass = true;
	force.Enabled = false; // start disabled
	force.Parent = root;

	tracked.set(root, force);
}

function scan(): void {
	for (const obj of Workspace.GetDescendants()) {
		if (obj.IsA("BasePart") && !obj.Anchored) {
			const model = obj.FindFirstAncestorOfClass("Model");

			if (model && model.FindFirstChildOfClass("Humanoid")) {
				if (obj.Name === "HumanoidRootPart") {
					setupRoot(obj);
				}
			} else {
				const root = obj.AssemblyRootPart;
				if (root && !root.Anchored) {
					setupRoot(root);
				}
			}
		}
	}
}

task.spawn(() => {
	while (true) {
		scan();
		task.wait(2);
	}
});

RunService.Heartbeat.Connect(() => {
	const moonPos = moon.Position;

	for (const [root, force] of tracked) {
		if (!root.Parent || !force.Parent) {
			tracked.delete(root);
			continue;
		}

		const offset = moonPos.sub(root.Position);
		const distSq = offset.Dot(offset);

		if (distSq <= gravityRangeSq) {
			const distance = math.sqrt(distSq);
			const alpha = (gravityRange - distance) / gravityRange;

			force.Enabled = true;
			force.Force = offset.Unit.mul(gravityStrength * alpha).mul(math.min(root.AssemblyMass, massCap));
		} else {
			if (force.Enabled) {
				force.Enabled = false;
				force.Force = Vector3.zero;
			}
		}
	}
});
