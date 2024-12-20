import { ApiProperty } from '@nestjs/swagger';
import { DifferencesHashMap } from '@common/classes/differences-hashmap';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class NewGame {
    @ApiProperty({
        minimum: 1,
        maximum: 200,
    })
    @IsString()
    name: string;

    @IsString()
    creator: string;

    @IsBoolean()
    wantShoutout: boolean;

    @ApiProperty()
    @IsString()
    image1: string;

    @ApiProperty()
    @IsString()
    image2: string;

    @ApiProperty({
        minimum: 3,
        maximum: 9,
    })
    @IsNumber()
    nbDifference: number;

    @ApiProperty()
    differenceMatrix: number[][];

    @ApiProperty()
    differenceHashMap: DifferencesHashMap[];

    @ApiProperty()
    @IsString()
    difficulty: string;
}
