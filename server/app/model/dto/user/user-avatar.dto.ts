import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserAvatar {
    @IsOptional()
    @IsString()
    avatar: string;

    @IsNotEmpty()
    @IsString()
    _id: string;

    avatarData: Uint8Array | string;
}
