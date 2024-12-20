import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class NewName {
    @ApiProperty({
        minimum: 1,
        maximum: 200,
    })
    @IsString()
    oldName: string;

    @ApiProperty({
        minimum: 1,
        maximum: 200,
    })
    @IsString()
    newName: string;
}
