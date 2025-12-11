import { RunService } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import { PlasmaProjectile } from "shared/weaponProjectiles/PlasmaProjectileLogic";
import { WeaponModule } from "shared/weaponProjectiles/WeaponModuleSystem";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

// ---------------------------
// Block Input Definition
// ---------------------------
const definition = {
	input: {
		projectileColor: {
			displayName: "Projectile Color",
			types: {
				color: {
					config: Colors.pink,
				},
			},
		},
		fireTrigger: {
			displayName: "Fire",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "F",
							switch: false,
							reversed: false,
						},
						canBeReversed: false,
						canBeSwitch: false,
					},
				},
			},
		},
		speedModifier: {
			displayName: "Speed Modifier",
			tooltip: "Adjusts the speed of fired projectiles.",
			types: {
				number: {
					config: 10,
					clamp: {
						min: 1,
						max: 10000,
						showAsSlider: true,
					},
				},
			},
		},
		recoilMultiplier: { // <-- New slider
			displayName: "Recoil Multiplier",
			tooltip: "Adjusts how strong the recoil is.",
			types: {
				number: {
					config: 1,
					clamp: {
						min: 0,
						max: 10,
						showAsSlider: true,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

// ---------------------------
// Logic Class
// ---------------------------
export type { Logic as PlasmaGunBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	private currentSpeedModifier: number;
	private currentRecoilMultiplier: number; // <-- store multiplier

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.currentSpeedModifier = 10; // default value
		this.currentRecoilMultiplier = 1; // default recoil multiplier

		const relativeOuts = new Map<BasePart, CFrame>();
		const module = WeaponModule.allModules[this.instance.Name];

		module.parentCollection.setMarkersVisibility(false);

		for (const p of module.parentCollection.calculatedOutputs)
			for (const o of p.outputs)
				relativeOuts.set(o.markerInstance, this.instance.GetPivot().ToObjectSpace(o.markerInstance.CFrame));

		this.event.subscribe(RunService.Heartbeat, () => {
			const pivo = this.instance.GetPivot();
			for (const e of module.parentCollection.calculatedOutputs) {
				for (const o of e.outputs) {
					o.markerInstance.PivotTo(pivo.ToWorldSpace(relativeOuts.get(o.markerInstance)!));
				}
			}
		});

		// Subscribe to input changes
		this.onk(["speedModifier", "recoilMultiplier"], ({ speedModifier, recoilMultiplier }) => {
			this.currentSpeedModifier = speedModifier;
			this.currentRecoilMultiplier = recoilMultiplier;
		});

		this.onk(["fireTrigger", "projectileColor"], ({ fireTrigger, projectileColor }) => {
			if (!fireTrigger) return;

			for (const e of module.parentCollection.calculatedOutputs) {
				const mainpart = (e.module.instance as BlockModel & { MainPart: BasePart & { Sound: Sound } }).MainPart;
				const sound = mainpart.FindFirstChild("Sound") as Sound & {
					pitch: PitchShiftSoundEffect;
				};

				if (sound) sound.pitch.Octave = math.random(1000, 1200) / 10000;

				for (const o of e.outputs) {
					sound?.Play();

					const direction = o.markerInstance.GetPivot().RightVector.mul(-1);

					// --- recoil clamp with multiplier ---
					const rawRecoil = 10 * this.currentSpeedModifier * this.currentRecoilMultiplier;
					const clampedRecoil = math.clamp(rawRecoil, 0, 500);
					mainpart.ApplyImpulse(direction.mul(-clampedRecoil));

					const inheritedSpeed = e.module.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
					const forwardOffset = math.clamp(inheritedSpeed * 0.05, 1, 50);
					const spawnPos = o.markerInstance.Position.add(direction.mul(forwardOffset));

					PlasmaProjectile.spawnProjectile.send({
						startPosition: spawnPos,
						baseVelocity: e.module.instance.PrimaryPart!.AssemblyLinearVelocity.add(direction.mul(this.currentSpeedModifier)),
						baseDamage: 100,
						modifier: e.modifier,
						color: projectileColor,
					});
				}
			}
		});
	}
}


// ---------------------------
// Block Export
// ---------------------------
export const PlasmaGunBlock = {
	...BlockCreation.defaults,
	id: "plasmagun",
	displayName: "Plasma Gun",
	description: "Shoots plasma projectiles with adjustable speed.",

	weaponConfig: {
		type: "CORE",
		modifier: {
			speedModifier: {
				value: 10,
			},
		},
		markers: {
			output1: {
				emitsProjectiles: true,
				allowedBlockIds: ["plasmagunbarrel", "plasmaseparatormuzzle", "plasmashotgunmuzzle"],
			},
		},
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
