/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Document } from 'mongoose';

export type ReviewGameDocument = GameReview & Document;

@Schema()
export class GameReview {
    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    review: number;

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    gameName: string;
    @ApiProperty()
    @Prop({ required: true })
    _id: string;
}

export const gameSchema = SchemaFactory.createForClass(GameReview);
