import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ConnectionsHistory {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsString()
    username: string;

    @IsNotEmpty()
    @IsString()
    connectionType: string;

    @IsNotEmpty()
    @IsNumber()
    connectionTime: number;
}
