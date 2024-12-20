import { GameStateSnapshot, ReplayEvent } from '@common/classes/video-replay';

export interface Replay {
    creator: string;
    creatorUsername?: string;
    gameName: string;
    timeCreated: number;
    events: ReplayEvent[];
    snapshots: GameStateSnapshot[];
    public: boolean;
    id: string;
    gameId?: string;
}

export interface NewReplay {
    creator: string;
    gameName: string;
    events: ReplayEvent[];
    snapshots: GameStateSnapshot[];
}

export interface Comment {
    comment: string;
    time: number;
    userId: string;
}
