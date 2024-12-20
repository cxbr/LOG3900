import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserProfileUI {
    @IsOptional()
    @IsString()
    avatar: string;

    @IsNotEmpty()
    @IsString()
    usernameColor: string;
}
