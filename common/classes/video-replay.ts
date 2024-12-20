import { GameRoom } from '@common/classes/game-room';

export enum Actions {
    GameStart = 'gameStart',
    GameEnd = 'gameEnd',
    DiffFound = 'diffFound',
    DiffFoundEnd = 'diffFoundEnd',
    Error = 'error',
    CheatModeStart = 'startCheatMode',
    CheatModeEnd = 'endCheatMode',
    CheatModeModified = 'cheatModeModified',
    Hint = 'hint',
}

export interface ReplayEvent {
    action: string;
    imageData1?: string;
    imageData2?: string;
    timestamp: number;
    username?: string;
    cheatData?: string;
}

export interface ReplayEventLayer {
    action: string;
    imageData1?: HTMLCanvasElement;
    imageData2?: HTMLCanvasElement;
    timestamp: number;
    username?: string;
    cheatData?: HTMLCanvasElement;
}

export interface GameStateSnapshot {
    gameRoom: GameRoom;
    imageData1: string;
    imageData2: string;
}

export interface GameStateSnapshotLayer {
    gameRoom: GameRoom;
    imageData1: HTMLCanvasElement;
    imageData2: HTMLCanvasElement;
}
