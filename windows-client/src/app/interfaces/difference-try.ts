import { Vec2 } from '@app/interfaces/vec2';
import { PlayerDifferences } from '@common/classes/user-game';

export interface DifferenceTry {
    validated: boolean;
    differencePos: Vec2;
    username: string;
    everyoneScore: PlayerDifferences[];
}
