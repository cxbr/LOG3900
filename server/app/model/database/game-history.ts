import { PlayerDifferences } from '@common/classes/user-game';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type HistoryDocument = GameHistory & Document;

@Schema()
export class GameHistory {
    @ApiProperty()
    @Prop({ required: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true })
    startTime: number;

    @ApiProperty()
    @Prop({ required: true })
    timer: number;

    @ApiProperty()
    @Prop({ required: true })
    players: string[];

    @ApiProperty()
    @Prop({ required: true })
    gameMode: string;

    @ApiProperty()
    @Prop({ required: false })
    abandoned: string[];

    @ApiProperty()
    @Prop({ required: false })
    winner: string;

    @ApiProperty()
    @Prop({ required: false })
    deletedByUsers: string[];

    @ApiProperty()
    @Prop({ required: true })
    playerDiff: PlayerDifferences[];

    @ApiProperty()
    @Prop({ required: true })
    _id: string;
}

export const gameHistorySchema = SchemaFactory.createForClass(GameHistory);
