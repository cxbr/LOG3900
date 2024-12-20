import { DifferencesHashMap } from '@common/classes/differences-hashmap';
export interface NewGame {
    name: string;
    creator: string;
    wantShoutout: boolean;
    image1: string;
    image2: string;
    difficulty: string;
    nbDifference: number;
    differenceMatrix: number[][];
    differenceHashMap: DifferencesHashMap[];
}

export interface NewName {
    oldName: string;
    newName: string;
}

export class NewBestTime {
    gameName: string;
    isSolo: boolean;
    name: string;
    time: number;
}

export interface GameHistory {
    name: string;
    startTime: number;
    timer: number;
    players: string[];
    gameMode: string;
    abandoned?: string[];
    winner: string;
    deletedByUsers?: string[];
    _id: string;
    playerDiff?: string[];
}

export interface EndGame {
    winner: string;
    roomId: string;
    players: string[];
    gameFinished: boolean;
    abandoned: string[];
    gameMode: string;
    gameName: string;
    gameDuration: number;
    tiedPlayers: string[];
}

export interface GameContext {
    gameName: string;
    gameMode: string;
}
