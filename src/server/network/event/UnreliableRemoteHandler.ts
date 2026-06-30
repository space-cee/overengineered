import { Players, RunService, Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { BlockManager } from "shared/building/BlockManager";
import { SharedPlots } from "shared/building/SharedPlots";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
import { PartUtils } from "shared/utils/PartUtils";
import { WeaponProjectile } from "shared/weaponProjectiles/BaseProjectileLogic";
import type { BlockDamageController } from "engine/shared/BlockDamageController";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { SpreadingFireController } from "server/SpreadingFireController";
import type { ExplosionEffect } from "shared/effects/ExplosionEffect";
import type { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";
import type { ExplodeArgs } from "shared/RemoteEvents";

@injectable
export class UnreliableRemoteController extends HostedService {
	constructor(
		@inject impactSoundEffect: ImpactSoundEffect,
		@inject spreadingFire: SpreadingFireController,
		@inject explosionEffect: ExplosionEffect,
		@inject playModeController: PlayModeController,
		@inject private readonly playersController: ServerPlayersController,
		@inject private readonly blockDamageController: BlockDamageController,
	) {
		super();

		const serverBreakQueue: Set<BasePart> = new Set();

		const impactBreakEvent = (player: Player | undefined, parts: BasePart[]) => {
			if (!player) {
				for (const part of parts) {
					serverBreakQueue.add(part);
				}
				return;
			}

			task.spawn(() => {
				const players = this.playersController.getPlayers().filter((p) => p !== player);
				CustomRemotes.physics.normalizeRootparts.send(players, { parts });

				for (const part of parts) {
					if (!BlockManager.isActiveBlockPart(part)) continue;
					ServerPartUtils.BreakJoints(part);
				}

				impactSoundEffect.send(parts[0], { blocks: parts, index: undefined });
			});
		};

		this.event.subscribe(RunService.Heartbeat, () => {
			if (serverBreakQueue.size() > 0) {
				const copy = [...serverBreakQueue];
				serverBreakQueue.clear();

				task.spawn(() => {
					const toSend = new Map<Player | 0, BasePart[]>();

					for (const block of copy) {
						impactSoundEffect.send(block, { blocks: [block], index: undefined });
						ServerPartUtils.BreakJoints(block);

						const owner = block.IsDescendantOf(Workspace) ? block.GetNetworkOwner() : undefined;
						toSend.getOrSet(owner ?? 0, () => []).push(block);
					}

					const players = this.playersController.getPlayers();
					for (const [player, parts] of toSend) {
						let sendTo = players;
						if (player !== 0) sendTo = players.except([player]);

						CustomRemotes.physics.normalizeRootparts.send(sendTo, { parts });
					}
				});
			}
		});

		const burnEvent = (parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				spreadingFire.burn(part);
			});
		};

		// TODO: Change this for some offensive update
		const explode = (player: Player | undefined, { part, isFlammable, pressure, radius }: ExplodeArgs) => {
			if (!ServerBlockLogic.staticIsValidBlock(part, player, playModeController)) {
				return;
			}

			radius = math.clamp(radius, 0, 16);
			pressure = math.clamp(pressure, 0, 2500);

			const hitParts = Workspace.GetPartBoundsInRadius(part.Position, radius);

			if (isFlammable) {
				const flameHitParts = Workspace.GetPartBoundsInRadius(part.Position, radius * 1.5);

				flameHitParts.forEach((part) => {
					if (math.random(1, 8) === 1) {
						spreadingFire.burn(part);
					}
				});
			}

			hitParts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) {
					return;
				}

				if (math.random(1, 2) === 1) {
					const players = Players.GetPlayers().filter((p) => p !== player);
					CustomRemotes.physics.normalizeRootparts.send(players, { parts: [part] });
					ServerPartUtils.BreakJoints(part);
				}

				part.Velocity = new Vector3(
					math.random(0, pressure / 40),
					math.random(0, pressure / 40),
					math.random(0, pressure / 40),
				);
			});

			part.Transparency = 1;
			PartUtils.applyToAllDescendantsOfType("Decal", part, (decal) => decal.Destroy());

			// Explosion sound
			explosionEffect.send(part, { part, index: undefined });
		};

		this.event.subscribe(RemoteEvents.ImpactBreak.invoked, impactBreakEvent);
		this.event.subscribe(RemoteEvents.Burn.invoked, (_, parts) => burnEvent(parts));
		this.event.subscribe(RemoteEvents.Explode.invoked, explode);

		const damageEvent = (
			player: Player,
			{
				part,
				damage,
				modifiers,
			}: {
				readonly part: BasePart;
				readonly damage: number;
				readonly modifiers: Array<
					Partial<
						Record<
							"heatDamage" | "impactDamage" | "explosiveDamage" | "speedModifier" | "lifetimeModifier",
							{ value: number; isRelative?: boolean }
						>
					>
				>;
			},
		) => {
			if (!BlockManager.isBlockPart(part)) return;
			if (playModeController.getPlayerMode(player) !== "ride") return;
			const plot = SharedPlots.staticTryGetPlotByOwnerID(player.UserId);
			if (!plot || !part.IsDescendantOf(plot)) return;

			const block = part.Parent as BlockModel;
			if (!block) return;

			// Calculate total damage from all modifiers
			let totalImpactDamage = damage;
			let totalHeatDamage = 0;
			let totalExplosiveDamage = 0;

			for (const modifier of modifiers) {
				if (modifier.impactDamage) {
					const value = modifier.impactDamage.value;
					totalImpactDamage += modifier.impactDamage.isRelative ? damage * value : value;
				}
				if (modifier.heatDamage) {
					const value = modifier.heatDamage.value;
					totalHeatDamage += modifier.heatDamage.isRelative ? damage * value : value;
				}
				if (modifier.explosiveDamage) {
					const value = modifier.explosiveDamage.value;
					totalExplosiveDamage += modifier.explosiveDamage.isRelative ? damage * value : value;
				}
			}

			this.blockDamageController.applyDamage(block, {
				impactDamage: totalImpactDamage,
				heatDamage: totalHeatDamage,
				explosiveDamage: totalExplosiveDamage,
			});
		};

		this.event.subscribe(WeaponProjectile.damageInstance.invoked, damageEvent);
	}
}
