import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUsernameColor {
    @IsNotEmpty()
    @IsString()
    readonly userId: string;

    @IsNotEmpty()
    @IsString()
    readonly usernameColor: string;
}
