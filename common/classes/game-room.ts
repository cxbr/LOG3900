import { GameConstants } from './game-constants';
import { UserGame } from './user-game';
export class GameRoom {
    userGame: UserGame;
    roomId: string;
    started: boolean;
    gameMode: string;
    gameConstants: GameConstants;
}
