import { BestTime } from './best-time';
import { DifferencesHashMap } from './differences-hashmap';

export class GameData {
    _id?: string;
    name: string;
    creator: string;
    wantShoutout: boolean;
    nbDifference: number;
    image1url: string;
    image2url: string;
    difficulty: string;
    soloBestTimes: BestTime[];
    vsBestTimes: BestTime[];
    isSelected?: boolean;
    differenceMatrix: number[][];
    differenceHashMap: DifferencesHashMap[];
}
