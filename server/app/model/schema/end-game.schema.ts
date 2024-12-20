import { PlayerDifferences } from '@common/classes/user-game';
import { ApiProperty } from '@nestjs/swagger';

export class EndGame {
    @ApiProperty()
    winner: string;

    @ApiProperty()
    roomId: string; // TODO: DO WE NEED THIS?

    @ApiProperty()
    players: string[];

    @ApiProperty()
    gameFinished: boolean;

    @ApiProperty()
    abandoned: string[];

    @ApiProperty()
    gameMode: string;

    @ApiProperty()
    gameName: string;

    @ApiProperty()
    gameDuration: number;

    @ApiProperty()
    tiedPlayers: string[];

    @ApiProperty()
    playerDiff: PlayerDifferences[];
}
