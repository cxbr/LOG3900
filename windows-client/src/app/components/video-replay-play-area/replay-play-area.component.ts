/* eslint-disable max-lines */
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { VideoReplayService } from '@app/services/video-replay/video-replay.service';
import { GameRoom } from '@common/classes/game-room';
import { Actions, GameStateSnapshot, GameStateSnapshotLayer, ReplayEvent, ReplayEventLayer } from '@common/classes/video-replay';
import { Dimensions } from 'src/assets/variables/picture-dimension';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-replay-play-area',
    templateUrl: './replay-play-area.component.html',
    styleUrls: ['./replay-play-area.component.scss'],
})
export class ReplayPlayAreaComponent implements AfterViewInit, OnChanges {
    @ViewChild('canvas1', { static: false }) canvas1: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) canvas2: ElementRef<HTMLCanvasElement>;

    @Input() events: ReplayEvent[];
    @Input() states: GameStateSnapshot[];
    @Input() playSignal?: EventEmitter<void>;
    @Input() pauseSignal?: EventEmitter<void>;
    @Input() restartSignal?: EventEmitter<void>;
    @Input() progress?: EventEmitter<number>;
    @Input() nextActionSignal?: EventEmitter<void>;
    @Input() playbackRate?: EventEmitter<number>;

    @Output() playEmitted = new EventEmitter<void>();
    @Output() pauseEmitted = new EventEmitter<void>();

    gameRoom: GameRoom;
    replayEventLayers: ReplayEventLayer[] = [];
    statesLayers: GameStateSnapshotLayer[] = [];
    private canvasSize = { x: Dimensions.DefaultWidth, y: Dimensions.DefaultHeight };
    private eventIndex = 0;
    private gameStartTimestamp: number;
    private replayInterval?: ReturnType<typeof setInterval>;
    private allFlashIntervals?: ReturnType<typeof setInterval>[] = [];
    private currentStateImage1: HTMLCanvasElement;
    private currentStateImage2: HTMLCanvasElement;
    private initialImageData1: HTMLCanvasElement;
    private initialImageData2: HTMLCanvasElement;
    private currentCheatEvent: ReplayEventLayer | null = null;
    private cheatModeActive: boolean;
    private cheatInterval?: ReturnType<typeof setInterval>;
    private audioValid = new Audio('assets/sounds/valid_sound.mp3');
    private audioInvalid = new Audio('assets/sounds/invalid_sound.mp3');
    private timer = 0;
    private currentPlaybackRate = 1;

    constructor(private videoReplayService: VideoReplayService) {}

    get width(): number {
        return this.canvasSize.x;
    }
    get height(): number {
        return this.canvasSize.y;
    }

    async ngAfterViewInit(): Promise<void> {
        this.videoReplayService.convertImageDataToLayers().then(() => {
            this.statesLayers = this.videoReplayService.statesLayers;
            this.replayEventLayers = this.videoReplayService.replayEventLayers;
            this.initCanvas();
        });
    }

    initCanvas(): void {
        this.eventIndex = this.replayEventLayers.findIndex((event) => event.action === Actions.GameStart);
        this.timer = 0;
        this.gameStartTimestamp = this.replayEventLayers[this.eventIndex].timestamp;
        this.initializeCanvases();
        this.subscribeToSignals();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.progress) {
            const newProgress = changes.progress.currentValue;
            this.seekToProgress(newProgress);
        }
    }

    private async initializeCanvases() {
        const gameStartEvent = this.statesLayers[this.replayEventLayers.findIndex((event) => event.action === Actions.GameStart)];
        if (gameStartEvent) {
            this.initialImageData1 = gameStartEvent.imageData1;
            this.initialImageData2 = gameStartEvent.imageData2;
            this.currentStateImage1 = this.initialImageData1;
            this.currentStateImage2 = this.initialImageData2;
            this.drawImageOnCanvas(this.canvas1.nativeElement, this.initialImageData1, false);
            this.drawImageOnCanvas(this.canvas2.nativeElement, this.initialImageData2, false);
        }
    }

    private drawImageOnCanvas(canvas: HTMLCanvasElement, imageData: HTMLCanvasElement, clearBeforeDraw = true) {
        const context = canvas.getContext('2d');
        if (clearBeforeDraw) {
            context?.clearRect(0, 0, canvas.width, canvas.height);
        }
        context?.drawImage(imageData, 0, 0, this.width, this.height);
    }

    private subscribeToSignals() {
        this.playSignal?.subscribe(() => {
            this.startReplay();
        });
        this.pauseSignal?.subscribe(() => {
            this.pauseReplay();
        });
        this.restartSignal?.subscribe(() => {
            this.restartReplay();
        });
        this.progress?.subscribe((newValue) => {
            this.seekToProgress(newValue);
        });
        this.nextActionSignal?.subscribe(() => {
            this.nextAction();
        });
        this.playbackRate?.subscribe((newRate) => {
            this.currentPlaybackRate = newRate;
        });
    }

    private nextAction() {
        const currentState = this.statesLayers[this.timer];
        if (currentState && this.eventIndex > this.replayEventLayers.length) {
            this.currentStateImage1 = currentState.imageData1;
            this.currentStateImage2 = currentState.imageData2;
            this.updateBackgroundState();
        }
        if (this.eventIndex < this.replayEventLayers.length) {
            let event = this.replayEventLayers[this.eventIndex];
            let timeDifference = Math.abs(this.gameStartTimestamp - event.timestamp) / Time.Thousand;
            if (timeDifference === this.timer) {
                this.processEvent(event, this.eventIndex);
                this.eventIndex++;
            }
            event = this.replayEventLayers[this.eventIndex];
            if (event) {
                timeDifference = Math.abs(this.gameStartTimestamp - event.timestamp) / Time.Thousand;
                while (timeDifference > this.timer && timeDifference < this.timer + 1) {
                    const delay = Math.abs(timeDifference - this.timer);
                    const newEvent = this.cloneEvent(event);
                    setTimeout(
                        (timeoutEvent, timeoutIndex) => {
                            this.processEvent(timeoutEvent, timeoutIndex);
                        },
                        delay / this.currentPlaybackRate,
                        newEvent,
                        this.eventIndex,
                    );
                    this.eventIndex++;
                    event = this.replayEventLayers[this.eventIndex];
                    if (!event) break;
                    timeDifference = Math.abs(this.gameStartTimestamp - event.timestamp) / Time.Thousand;
                }
            }
            this.timer++;
        } else {
            this.pauseReplay();
            this.pauseEmitted.emit();
        }
    }

    private cloneEvent(event: ReplayEventLayer) {
        return {
            action: event.action,
            imageData1: this.cloneCanvas(event.imageData1),
            imageData2: this.cloneCanvas(event.imageData2),
            timestamp: event.timestamp,
            username: event.username,
            cheatData: this.cloneCanvas(event.cheatData),
        };
    }

    private cloneCanvas(oldCanvas?: HTMLCanvasElement) {
        if (oldCanvas === undefined) return undefined;
        const newCanvas = document.createElement('canvas');
        const context = newCanvas.getContext('2d');

        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        context?.drawImage(oldCanvas, 0, 0);
        return newCanvas;
    }
    private startReplay() {
        if (this.cheatModeActive && this.currentCheatEvent != null) {
            this.startCheatMode(
                this.currentCheatEvent.imageData1 as HTMLCanvasElement,
                this.currentCheatEvent.imageData2 as HTMLCanvasElement,
                this.currentCheatEvent.cheatData as HTMLCanvasElement,
            );
        }

        if (this.replayInterval) return;
    }

    private updateBackgroundState() {
        if (this.currentStateImage1) {
            this.drawImageOnCanvas(this.canvas1.nativeElement, this.currentStateImage1, false);
        }
        if (this.currentStateImage2) {
            this.drawImageOnCanvas(this.canvas2.nativeElement, this.currentStateImage2, false);
        }
    }

    private pauseReplay() {
        if (this.replayInterval) {
            clearInterval(this.replayInterval);
            this.replayInterval = undefined;
        }
        if (this.cheatModeActive) {
            clearInterval(this.cheatInterval);
            this.cheatInterval = undefined;
        }
    }

    private restartReplay() {
        this.eventIndex = this.replayEventLayers.findIndex((event) => event.action === Actions.GameStart);
        this.timer = 0;
        clearInterval(this.cheatInterval);
        this.cheatInterval = undefined;
        this.cheatModeActive = false;
        this.clearAllIntervals();
        this.initializeCanvases();
    }

    private seekToProgress(timestamp: number) {
        if (this.statesLayers.length > 0 && this.replayEventLayers.length > 0) {
            let closestState: GameStateSnapshotLayer | undefined;
            let closestTimestamp = Number.MAX_SAFE_INTEGER;
            this.timer = timestamp;
            this.clearAllIntervals();
            this.allFlashIntervals = [];
            this.statesLayers.forEach((state, key) => {
                const timeDifference = Math.abs(timestamp - key);
                if (timeDifference < closestTimestamp) {
                    closestTimestamp = timeDifference;
                    closestState = state;
                }
            });

            if (this.currentCheatEvent !== null && this.currentCheatEvent.timestamp > closestTimestamp) {
                clearInterval(this.cheatInterval);
                this.cheatInterval = undefined;
                this.cheatModeActive = false;
            }

            this.findIndicesAfterDifference(timestamp);

            if (closestState) {
                this.updateCanvases(closestState.imageData1, closestState.imageData2);
            }
        }
    }

    private findIndicesAfterDifference(timestamp: number) {
        const boundaryTimestamp = this.replayEventLayers[0].timestamp + timestamp * Time.Thousand;
        for (let i = 0; i < this.replayEventLayers.length; i++) {
            if (this.replayEventLayers[i].timestamp > boundaryTimestamp) {
                this.eventIndex = i;
                return;
            }
        }
        this.eventIndex = 0;
    }

    private updateCanvases(imageData1: HTMLCanvasElement, imageData2: HTMLCanvasElement) {
        this.drawImageOnCanvas(this.canvas1.nativeElement, imageData1, false);
        this.drawImageOnCanvas(this.canvas2.nativeElement, imageData2, false);
    }

    private clearAllIntervals() {
        if (this.allFlashIntervals) {
            this.allFlashIntervals.forEach((interval) => {
                clearInterval(interval);
            });
            this.allFlashIntervals = [];
        }
    }

    private processEvent(event: ReplayEventLayer, index: number): void {
        switch (event.action) {
            case Actions.DiffFound:
                this.audioValid.pause();
                this.audioValid.play();
                this.flashDifferenceFound(event.imageData1 as HTMLCanvasElement, event.imageData2 as HTMLCanvasElement, index);
                break;
            case Actions.Error:
                this.audioInvalid.play();
                this.showTemporarily(this.canvas1.nativeElement, event.imageData1 as HTMLCanvasElement, Time.Thousand / this.currentPlaybackRate);
                this.showTemporarily(this.canvas2.nativeElement, event.imageData2 as HTMLCanvasElement, Time.Thousand / this.currentPlaybackRate);
                break;
            case Actions.CheatModeStart:
                this.cheatModeActive = true;
                this.startCheatMode(
                    event.imageData1 as HTMLCanvasElement,
                    event.imageData2 as HTMLCanvasElement,
                    event.cheatData as HTMLCanvasElement,
                );
                this.currentCheatEvent = event;
                break;
            case Actions.CheatModeEnd:
                this.cheatModeActive = false;
                this.currentCheatEvent = null;
                clearInterval(this.cheatInterval);
                this.cheatInterval = undefined;
                this.drawImageOnCanvas(this.canvas1.nativeElement, this.currentStateImage1, false);
                this.drawImageOnCanvas(this.canvas2.nativeElement, this.currentStateImage2, false);
                break;
            case Actions.CheatModeModified:
                if (this.cheatModeActive) {
                    clearInterval(this.cheatInterval);
                    this.cheatInterval = undefined;
                    this.startCheatMode(
                        event.imageData1 as HTMLCanvasElement,
                        event.imageData2 as HTMLCanvasElement,
                        event.cheatData as HTMLCanvasElement,
                    );
                }
                break;
            case Actions.Hint:
                this.flashDifference(event.imageData1 as HTMLCanvasElement, event.imageData2 as HTMLCanvasElement);
                break;
            case Actions.DiffFoundEnd:
                break;
            default:
                break;
        }
    }

    private resetCanvasAfterDiffFoundEnd(event: ReplayEventLayer) {
        this.currentStateImage1 = event.imageData1 as HTMLCanvasElement;
        this.currentStateImage2 = event.imageData2 as HTMLCanvasElement;
        this.drawImageOnCanvas(this.canvas1.nativeElement, this.currentStateImage1, false);
        this.drawImageOnCanvas(this.canvas2.nativeElement, this.currentStateImage2, false);
    }

    private getNextDiffFoundEndEventBasedOnCurrentIndex(index: number): ReplayEventLayer | undefined {
        for (let i = index; i < this.replayEventLayers.length; i++) {
            if (this.replayEventLayers[i].action === Actions.DiffFoundEnd) {
                return this.replayEventLayers[i];
            }
        }
        return undefined;
    }

    private flashDifference(imageData1: HTMLCanvasElement, imageData2: HTMLCanvasElement) {
        let visible = true;
        const flashInterval = Time.Fifty;
        const intervalId = setInterval(() => {
            if (visible) {
                this.canvas1.nativeElement.getContext('2d')?.drawImage(imageData1, 0, 0, this.width, this.height);
                this.canvas2.nativeElement.getContext('2d')?.drawImage(imageData2, 0, 0, this.width, this.height);
            } else {
                this.drawImageOnCanvas(this.canvas1.nativeElement, this.currentStateImage1, false);
                this.drawImageOnCanvas(this.canvas2.nativeElement, this.currentStateImage2, false);
            }
            visible = !visible;
        }, flashInterval / this.currentPlaybackRate);
        const endInterval = setTimeout(() => {
            clearInterval(intervalId);
            if (!visible) {
                this.drawImageOnCanvas(this.canvas1.nativeElement, this.currentStateImage1, false);
                this.drawImageOnCanvas(this.canvas2.nativeElement, this.currentStateImage2, false);
            }
        }, Time.Thousand / this.currentPlaybackRate);

        this.allFlashIntervals?.push(intervalId);
        this.allFlashIntervals?.push(endInterval);
    }

    private flashDifferenceFound(imageData1: HTMLCanvasElement, imageData2: HTMLCanvasElement, index: number): void {
        let visible = true;
        const flashInterval = Time.Fifty;

        const intervalToAdd = setInterval(() => {
            if (visible) {
                this.canvas1.nativeElement.getContext('2d')?.drawImage(imageData1, 0, 0, this.width, this.height);
                this.canvas2.nativeElement.getContext('2d')?.drawImage(imageData2, 0, 0, this.width, this.height);
            } else {
                this.drawImageOnCanvas(this.canvas1.nativeElement, this.currentStateImage1, false);
                this.drawImageOnCanvas(this.canvas2.nativeElement, this.currentStateImage2, false);
            }
            visible = !visible;
        }, flashInterval / this.currentPlaybackRate);
        const nextDiffFoundEndEvent = this.getNextDiffFoundEndEventBasedOnCurrentIndex(index);
        const endInterval = setTimeout(() => {
            clearInterval(intervalToAdd);

            // Lets check the next diff found end event
            if (nextDiffFoundEndEvent) {
                this.resetCanvasAfterDiffFoundEnd(nextDiffFoundEndEvent);
            }
        }, Time.FiveHundreds / this.currentPlaybackRate);

        this.allFlashIntervals?.push(intervalToAdd);
        this.allFlashIntervals?.push(endInterval);
    }

    private showTemporarily(canvas: HTMLCanvasElement, imageData: HTMLCanvasElement, duration: number) {
        const context = canvas.getContext('2d');
        context?.drawImage(imageData, 0, 0, this.width, this.height);
        const layer = canvas === this.canvas1.nativeElement ? this.currentStateImage1 : this.currentStateImage2;
        setTimeout(
            (canvasState) => {
                this.drawImageOnCanvas(canvas, canvasState, false);
            },
            duration,
            layer,
        );
    }

    private startCheatMode(imageData1: HTMLCanvasElement, imageData2: HTMLCanvasElement, cheatData: HTMLCanvasElement) {
        const flashDuration = 125;
        const canvas1 = this.canvas1.nativeElement.getContext('2d');
        const canvas2 = this.canvas2.nativeElement.getContext('2d');
        if (canvas1 === null || canvas2 === null) return;
        let isFlashing = true;
        this.cheatInterval = setInterval(() => {
            if (isFlashing) {
                canvas1.drawImage(imageData1, 0, 0, this.width, this.height);
                canvas2.drawImage(imageData2, 0, 0, this.width, this.height);
            } else {
                canvas1.drawImage(cheatData, 0, 0, this.width, this.height);
                canvas2.drawImage(cheatData, 0, 0, this.width, this.height);
            }
            isFlashing = !isFlashing;
        }, flashDuration / this.currentPlaybackRate);
    }
}
