import { GameStateSnapshot, ReplayEvent } from '@common/classes/video-replay';
import { IsNotEmpty, IsString } from 'class-validator';

export class NewReplay {
    @IsNotEmpty()
    @IsString()
    creator: string;

    @IsNotEmpty()
    @IsString()
    gameName: string;

    @IsNotEmpty()
    events: ReplayEvent[];

    @IsNotEmpty()
    snapshots: GameStateSnapshot[];
}
