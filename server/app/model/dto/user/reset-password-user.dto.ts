import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordUser {
    @IsNotEmpty()
    @IsString()
    readonly username: string;

    @IsNotEmpty()
    @IsString()
    readonly userId: string;
}
