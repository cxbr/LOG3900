import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class NewUser {
    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    avatar: string;

    @IsOptional()
    _id: string;

    joinedChannels: string[];
    avatarData: Uint8Array | string;
}
