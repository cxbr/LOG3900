import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    username: string;

    @ApiProperty()
    @Prop({ required: false })
    @IsString()
    @IsOptional()
    usernameColor: string;

    @ApiProperty()
    @Prop({ required: true })
    @IsEmail()
    email: string;

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    password: string;

    @ApiProperty()
    @Prop({ required: true })
    joinedChannels: { channelId: string; numberOfUnreadMessages: number }[];

    @ApiProperty()
    @Prop({ required: false })
    @IsString()
    @IsOptional()
    avatar: string;

    @ApiProperty()
    @Prop({ required: true, default: [] })
    friendList: string[];

    @ApiProperty()
    @Prop({ required: true, default: [] })
    friendRequestSent: string[];

    @ApiProperty()
    @Prop({ required: true, default: [] })
    friendRequestReceived: { userId: string; seen: boolean }[];

    @ApiProperty()
    @Prop({ required: true })
    @IsString()
    _id: string;
}

export const userSchema = SchemaFactory.createForClass(User);
