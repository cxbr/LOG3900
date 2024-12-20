import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ReplayGameScoreboardComponent } from '@app/components/video-replay-game-scoreboard/replay-game-scoreboard.component';
import { ReplayPlayAreaComponent } from '@app/components/video-replay-play-area/replay-play-area.component';
import { VideoReplayService } from '@app/services/video-replay/video-replay.service';
import { GameData } from '@common/classes/game-data';
import { GameStateSnapshot, ReplayEvent } from '@common/classes/video-replay';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-video-replay-dialog',
    templateUrl: './video-replay-dialog.component.html',
    styleUrls: ['./video-replay-dialog.component.scss'],
})
export class VideoReplayDialogComponent implements OnInit, OnDestroy {
    @ViewChild(ReplayPlayAreaComponent) playAreaComponent: ReplayPlayAreaComponent;
    @ViewChild(ReplayGameScoreboardComponent) gameScoreBoardComponent: ReplayGameScoreboardComponent;

    @Input() playEmitted?: EventEmitter<void>;
    @Input() pauseEmitted?: EventEmitter<void>;
    gameData: GameData;
    playSignal = new EventEmitter<void>();
    pauseSignal = new EventEmitter<void>();
    restartSignal = new EventEmitter<void>();
    progressChanged = new EventEmitter<number>();
    nextActionSignal = new EventEmitter<void>();
    playbackRateChanged = new EventEmitter<number>();
    isChangingProgress: boolean = false;

    events: ReplayEvent[] = [];
    states: GameStateSnapshot[] = [];
    maxProgressValue: number = Time.OneHundred;
    currentProgress = 0;
    elapsedSeconds = 0;
    playbackRate = 1;
    playInterval?: number;
    isReplayPage = false;
    allPlayStates = PlayState;
    currentPlayState: PlayState = PlayState.Stopped;

    private buttons: NodeListOf<HTMLButtonElement>;

    constructor(private replayService: VideoReplayService, private router: Router, public dialog: MatDialog) {}

    ngOnInit() {
        this.isReplayPage = this.router.url.split('/')[1] === 'video-replay';
        this.buttons = document.querySelectorAll('.speed-button');
        this.initButtons();
        this.events = this.replayService.getReplayData();
        this.states = this.replayService.getReplayStates();
        this.gameData = this.replayService.gameData;
        this.setupSignalSubscriptions();
        this.setPlaybackRate(1);
        this.restart();
    }

    ngOnDestroy() {
        clearInterval(this.playInterval);
        this.playInterval = undefined;
    }

    setupSignalSubscriptions() {
        this.playEmitted?.subscribe(() => {
            this.play();
        });

        this.pauseEmitted?.subscribe(() => {
            this.pause();
        });
    }

    setupProgress() {
        this.maxProgressValue = this.states.length - 1;
        this.currentProgress = 0;
    }

    seekToProgress(progressValue: number) {
        this.currentProgress = progressValue;
        if (this.isChangingProgress) {
            this.elapsedSeconds = this.currentProgress;
            this.progressChanged.emit(this.currentProgress);
            if (this.currentPlayState === PlayState.Stopped) {
                this.pause();
                this.currentPlayState = PlayState.Paused;
            }
        }
    }

    setPlaybackRate(rate: number): void {
        this.buttons.forEach((button) => {
            if (parseFloat(button.innerText.replace('x', '')) === rate) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        this.playbackRate = rate;
        this.maxProgressValue = Math.ceil(this.states.length - 1);
        this.playbackRateChanged.emit(rate);
        if (this.playInterval) {
            this.pause();
            this.play();
        }
    }

    play() {
        if (this.playInterval || this.currentPlayState === PlayState.Playing) return;
        this.currentPlayState = PlayState.Playing;
        this.playSignal.emit();
        this.playInterval = setInterval(() => {
            if (this.elapsedSeconds <= this.maxProgressValue) {
                this.elapsedSeconds += 1;
                this.currentProgress = this.elapsedSeconds;
                this.seekToProgress(this.currentProgress);
                this.nextActionSignal.emit();
            } else {
                this.pause();
                this.currentPlayState = PlayState.Stopped;
            }
        }, Time.Thousand / this.playbackRate) as unknown as number;
    }

    pause() {
        if (this.playInterval) {
            this.currentPlayState = PlayState.Paused;
            clearInterval(this.playInterval);
            this.playInterval = undefined;
            this.pauseSignal.emit();
        }
    }

    restart() {
        this.pause();
        this.elapsedSeconds = 0;
        this.currentProgress = 0;
        this.seekToProgress(0);
        this.restartSignal.emit();
        this.play();
    }

    reset(save: boolean) {
        if (save) {
            this.replayService.saveReplay();
        } else {
            this.replayService.events = [];
            this.replayService.snapshots = [];
            this.playInterval = undefined;
            this.dialog.closeAll();
        }
    }

    private initButtons(): void {
        this.buttons.forEach((button) => {
            button.addEventListener('click', () => {
                const rate = parseFloat(button.innerText.replace('x', ''));
                this.setPlaybackRate(rate);
            });
        });
    }
}

export enum PlayState {
    Playing,
    Paused,
    Stopped,
}
