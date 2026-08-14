// CURRENT VERSION
import { HostedService } from "engine/shared/di/HostedService";
import { Objects } from "engine/shared/fixes/Objects";
import { ArmMountBlockServerLogic } from "server/blocks/logic/ArmMountBlockServerLogic";
import { BackMountBlockServerLogic } from "server/blocks/logic/BackMountBlockServerLogic";
import { BeaconServerLogic } from "server/blocks/logic/BeaconBlockServerLogic";
import { BracedShaftServerLogic } from "server/blocks/logic/BracedShaftServerLogic";
import { ButtonServerLogic } from "server/blocks/logic/ButtonServerLogic";
import { CameraBlockServerLogic } from "server/blocks/logic/CameraBlockServerLogic";
import { DisconnectBlockServerLogic } from "server/blocks/logic/DisconnectBlockServerLogic";
//import { Display16ServerLogic } from "server/blocks/logic/Display16ServerLogic";
//import { Display32ServerLogic } from "server/blocks/logic/Display32ServerLogic";
import { HandleBlockServerLogic } from "server/blocks/logic/HandleBlockServerLogic";
import { HeadMountBlockServerLogic } from "server/blocks/logic/HeadMountBlockServerLogic";
import { LEDDisplayServerLogic } from "server/blocks/logic/LEDDisplayServerLogic";
import { LegMountBlockServerLogic } from "server/blocks/logic/LegMountBlockServerLogic";
import { LimbMountBlockServerLogic } from "server/blocks/logic/LimbMountBlockServerLogic";
import { ParticleServerLogic } from "server/blocks/logic/ParticleBlockServerLogic";
import { PropellantBlockServerLogic } from "server/blocks/logic/PropellantBlocksServerLogic";
import { ScreenServerLogic } from "server/blocks/logic/ScreenServerLogic";
import { SeatBlocksServerLogic } from "server/blocks/logic/SeatBlocksLogic";
import { SevenSegmentDisplayServerLogic } from "server/blocks/logic/SevenSegmentDisplayServerLogic";
import { SpeakerServerLogic } from "server/blocks/logic/SpeakerBlockServerLogic";
import { SquareButtonServerLogic } from "server/blocks/logic/SquareButtonServerLogic";
import { UnscaledScreenServerLogic } from "server/blocks/logic/UnscaledScreenServerLogic";
import { ServerBlockLogic } from "server/blocks/ServerBlockLogic";
import { PassengerSeatBlocks } from "shared/blocks/blocks/grouped/PassengerSeatBlocks";
import { VehicleSeatBlocks } from "shared/blocks/blocks/VehicleSeatBlocks";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

type ServerBlockLogicRegistry = {
	readonly [k in BlockId]?: new (...args: never) => ServerBlockLogic<GenericBlockLogicCtor>;
};

@injectable
export class ServerBlockLogicController extends HostedService {
	constructor(
		@inject blockList: BlockList,
		@inject playModeController: PlayModeController,
		@inject container: DIContainer,
	) {
		super();
		container = container.beginScope();

		for (const [, { logic }] of pairs(blockList.blocks)) {
			if (!logic?.events) continue;

			for (const [, event] of pairs(logic.events)) {
				event.addServerMiddleware((invoker, arg) => {
					if (!arg.block) return { success: false, message: "No block" };
					if (!arg.block?.PrimaryPart) return { success: false, message: "No primary part" };

					const err = ServerBlockLogic.staticIsValidBlockNamed(
						arg.block.PrimaryPart,
						invoker,
						playModeController,
						undefined,
						false,
					);
					if (err) {
						return { success: false, message: err };
					}

					return { success: true, value: arg };
				});
			}
		}

		const serverBlockLogicRegistry: ServerBlockLogicRegistry = {
			camera: CameraBlockServerLogic,
			disconnectblock: DisconnectBlockServerLogic,
			leddisplay: LEDDisplayServerLogic,
			screen: ScreenServerLogic,
			button: ButtonServerLogic,
			speaker: SpeakerServerLogic,
			particleemitter: ParticleServerLogic,
			sevensegmentdisplay: SevenSegmentDisplayServerLogic,
			bracedshaft: BracedShaftServerLogic,
			beacon: BeaconServerLogic,
			backmount: BackMountBlockServerLogic,
			propellantblock: PropellantBlockServerLogic,
			squarebutton: SquareButtonServerLogic,
			armmount: ArmMountBlockServerLogic,
			headmount: HeadMountBlockServerLogic,
			limbmount: LimbMountBlockServerLogic,
			//display16: Display16ServerLogic,
			//display32: Display32ServerLogic,
			legmount: LegMountBlockServerLogic,
			unscaledscreen: UnscaledScreenServerLogic,
			handle: HandleBlockServerLogic,
			longhandle: HandleBlockServerLogic,
			...Objects.fromEntries(VehicleSeatBlocks.map((b) => [b.id, SeatBlocksServerLogic] as const)),
			...Objects.fromEntries(PassengerSeatBlocks.map((b) => [b.id, SeatBlocksServerLogic] as const)),
		};

		//
		const logics: object[] = [];
		for (const [id, logic] of pairs(serverBlockLogicRegistry)) {
			$log(`Initializing server logic for ${id}`);

			const bl = blockList.blocks[id]?.logic?.ctor;
			if (!bl) {
				throw `Unknown server block logic id ${id}`;
			}

			logics.push(container.resolveForeignClass(logic, [bl] as never));
		}
	}
}
