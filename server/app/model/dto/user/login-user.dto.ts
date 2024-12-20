import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUser {
    @IsNotEmpty()
    @IsString()
    readonly username: string;

    @IsNotEmpty()
    @IsString()
    readonly password: string;
}
