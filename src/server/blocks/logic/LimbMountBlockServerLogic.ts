import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { LimbMountBlockLogic } from "shared/blocks/blocks/LimbMountBlock";

@injectable
export class LimbMountBlockServerLogic extends ServerBlockLogic<typeof LimbMountBlockLogic> {
	constructor(logic: typeof LimbMountBlockLogic, @inject playModeController: PlayModeController) {
		super(logic, playModeController);

		const getPlayerLimb = (p: Player, attachTo: string) => {
			const humanoid = p.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
			if (!humanoid) return;

			const character = humanoid.Parent;
			if (!character) return;

			const R15_MAP: Record<string, string> = {
				leftHand: "LeftHand",
				rightHand: "RightHand",
				leftFoot: "LeftFoot",
				rightFoot: "RightFoot",
			};

			const R6_MAP: Record<string, string> = {
				leftHand: "Left Arm",
				rightHand: "Right Arm",
				leftFoot: "Left Leg",
				rightFoot: "Right Leg",
			};

			if (humanoid.RigType === Enum.HumanoidRigType.R15) {
				const limbName = R15_MAP[attachTo];
				return limbName ? (character.FindFirstChild(limbName) as BasePart) : undefined;
			} else {
				const limbName = R6_MAP[attachTo];
				return limbName ? (character.FindFirstChild(limbName) as BasePart) : undefined;
			}
		};

		const isAlreadyWelded = (w: Motor6D) => w.Part1 !== undefined;

		logic.events.weldMountUpdate.invoked.Connect((player, data) => {
			if (!player) return;
			const isWeldRequest = data.weldedState && !isAlreadyWelded(data.block.PlayerWeldConstraint);

			// weld if unwelded
			if (isWeldRequest) {
				const limb = getPlayerLimb(player, data.attachTo);
				if (!limb) return;

				data.block.PlayerWeldConstraint.C0 = new CFrame(new Vector3(0, 0, -limb.Size.Z));
				data.block.PlayerWeldConstraint.Part1 = limb;
				ServerPartUtils.switchDescendantsNetworkOwner(data.block, player);

				// update logic across all clients
				logic.events.updateLogic.send("everyone", {
					block: data.block,
					weldedTo: player,
				});
				return;
			}

			// unweld otherwise
			data.block.PlayerWeldConstraint.Part1 = undefined;
			ServerPartUtils.switchDescendantsNetworkOwner(data.block, data.owner);

			logic.events.updateLogic.send("everyone", {
				block: data.block,
				weldedTo: undefined,
			});
		});
	}
}
