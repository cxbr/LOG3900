import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { VideoReplayService } from '@app/services/video-replay/video-replay.service';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { GameStateSnapshot, ReplayEvent } from '@common/classes/video-replay';
import { Subscription } from 'rxjs';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-replay-game-scoreboard',
    templateUrl: './replay-game-scoreboard.component.html',
    styleUrls: ['./replay-game-scoreboard.component.scss'],
})
export class ReplayGameScoreboardComponent implements OnInit, OnChanges, OnDestroy {
    @Input() events: ReplayEvent[];
    @Input() states: GameStateSnapshot[];
    @Input() playSignal?: EventEmitter<void>;
    @Input() pauseSignal?: EventEmitter<void>;
    @Input() restartSignal?: EventEmitter<void>;
    @Input() progress?: EventEmitter<number>;
    @Input() nextActionSignal?: EventEmitter<void>;

    gameRoom: GameRoom;
    difficulty: string;
    totalNumber: number;
    isCheatModeActive: boolean;
    minutes: number;
    seconds: number;
    currentAction = 0;
    gameData: GameData;
    private timerInterval?: ReturnType<typeof setInterval>;
    private playSignalSubscription: Subscription | undefined;
    private pauseSignalSubscription: Subscription | undefined;
    private restartSignalSubscription: Subscription | undefined;
    private progressSubscription: Subscription | undefined;
    private nextActionSignalSubscription: Subscription | undefined;

    constructor(private replayService: VideoReplayService) {}

    ngOnInit(): void {
        this.gameData = this.replayService.gameData;
        this.initializeGameState();
        this.subscribeToSignals();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.progress) {
            const newProgress = changes.progress.currentValue;
            this.seekToProgress(newProgress);
        }
    }

    ngOnDestroy(): void {
        this.pauseReplay();
        this.unsubscribeToSignals();
    }

    isAndroidByUsername(username: string): boolean {
        const player = this.gameRoom.userGame.currentPlayers.find((p) => p.username === username);
        return player ? player.isAndroid : false;
    }

    private initializeGameState(): void {
        if (this.states.length > 0) {
            const firstState = this.states[this.currentAction];
            if (firstState) {
                this.totalNumber = this.gameData.nbDifference;
                this.difficulty = this.gameData.difficulty;
                this.gameRoom = firstState.gameRoom;
                this.minutes = Math.floor(this.gameRoom.userGame.timer / Time.Sixty);
                this.seconds = this.gameRoom.userGame.timer % Time.Sixty;
            }
        }
    }

    private subscribeToSignals(): void {
        this.playSignalSubscription = this.playSignal?.subscribe(() => this.playReplay());
        this.pauseSignalSubscription = this.pauseSignal?.subscribe(() => this.pauseReplay());
        this.restartSignalSubscription = this.restartSignal?.subscribe(() => this.restartReplay());
        this.progressSubscription = this.progress?.subscribe((newValue) => this.seekToProgress(newValue));
        this.nextActionSignalSubscription = this.nextActionSignal?.subscribe(() => {
            this.playReplay();
        });
    }

    private unsubscribeToSignals(): void {
        if (this.playSignalSubscription) {
            this.playSignalSubscription.unsubscribe();
            this.playSignalSubscription = undefined;
        }
        if (this.pauseSignalSubscription) {
            this.pauseSignalSubscription.unsubscribe();
            this.pauseSignalSubscription = undefined;
        }
        if (this.restartSignalSubscription) {
            this.restartSignalSubscription.unsubscribe();
            this.restartSignalSubscription = undefined;
        }
        if (this.progressSubscription) {
            this.progressSubscription.unsubscribe();
            this.progressSubscription = undefined;
        }
        if (this.nextActionSignalSubscription) {
            this.nextActionSignalSubscription.unsubscribe();
            this.nextActionSignalSubscription = undefined;
        }
    }

    private playReplay(): void {
        if (this.states.length > this.currentAction) {
            const firstState = this.states[this.currentAction++];
            if (firstState) {
                this.gameRoom = firstState.gameRoom;
                this.minutes = Math.floor(this.gameRoom.userGame.timer / Time.Sixty);
                this.seconds = this.gameRoom.userGame.timer % Time.Sixty;
            }
        }
    }

    private pauseReplay(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = undefined;
        }
    }

    private restartReplay(): void {
        this.currentAction = 0;
        this.initializeGameState();
    }

    private seekToProgress(progressValue: number): void {
        let closestStateKey = null;
        for (const key of Array.from(this.states.keys()).sort((a, b) => a - b)) {
            if (key <= progressValue) {
                closestStateKey = key;
            } else {
                break;
            }
        }
        if (closestStateKey !== null) {
            this.currentAction = progressValue;
            const closestState = this.states[closestStateKey];
            if (closestState) {
                this.updateComponentState(closestState);
            }
        }
    }

    private updateComponentState(state: GameStateSnapshot): void {
        this.gameRoom = state.gameRoom;
        this.totalNumber = this.gameData.nbDifference;
        this.difficulty = this.gameData.difficulty;
        this.minutes = Math.floor(state.gameRoom.userGame.timer / Time.Sixty);
        this.seconds = state.gameRoom.userGame.timer % Time.Sixty;
    }
}
