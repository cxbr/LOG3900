import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Document } from 'mongoose';

export type ConnectionsDocument = ConnectionsHistory & Document;

@Schema()
export class ConnectionsHistory {
    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    userId: string;

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    username: string;

    @ApiProperty()
    @Prop({ required: true })
    connectionType: string;

    @ApiProperty()
    @Prop({ required: true })
    connectionTime: number;

    @ApiProperty()
    @IsString()
    _id?: string;
}

export const connectionsHistorySchema = SchemaFactory.createForClass(ConnectionsHistory);
