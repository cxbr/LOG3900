import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class GameConstants {
    @ApiProperty()
    @IsNumber()
    gameDuration: number;

    @ApiProperty()
    @IsNumber()
    penaltyTime: number;

    @ApiProperty()
    @IsNumber()
    bonusTime: number;
}
