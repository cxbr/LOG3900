import { BestTime } from '@common/classes/best-time';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema()
export class Game {
    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    name: string;

    @ApiProperty()
    @Prop({ required: true })
    @IsBoolean()
    isDeleted: boolean;

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    creator: string;

    @ApiProperty()
    @Prop({ required: true })
    @IsBoolean()
    wantShoutout: boolean;

    @ApiProperty()
    @Prop({ required: true })
    @IsNumber()
    nbDifference: number;

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    difficulty: string;

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    soloBestTimes: BestTime[];

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    vsBestTimes: BestTime[];

    @ApiProperty()
    _id?: string;
}

export const gameSchema = SchemaFactory.createForClass(Game);
