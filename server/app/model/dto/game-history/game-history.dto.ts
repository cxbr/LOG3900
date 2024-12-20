import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
export class GameHistory {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNumber()
    startTime: number;

    @ApiProperty()
    @IsNumber()
    timer: number;

    @ApiProperty()
    @IsString()
    players: string[];

    @ApiProperty()
    @IsString()
    gameMode: string;

    @ApiProperty()
    @IsString()
    abandoned?: string[];

    @ApiProperty()
    @IsString()
    winner: string;

    @ApiProperty()
    @IsString()
    deletedByUsers?: string[];

    @ApiProperty()
    @IsString()
    _id: string;
}
