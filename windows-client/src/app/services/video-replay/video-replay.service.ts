import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { ReplayHttpService } from '@app/services/replay-http/replay-http.service';
import { UserService } from '@app/services/user/user.service';
import { GameData } from '@common/classes/game-data';
import { NewReplay, Replay } from '@common/classes/replay';
import { GameStateSnapshot, GameStateSnapshotLayer, ReplayEvent, ReplayEventLayer } from '@common/classes/video-replay';

@Injectable({
    providedIn: 'root',
})
export class VideoReplayService {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    static readonly stateSetFrequencyMs = 1000;

    events: ReplayEvent[] = [];
    gameData: GameData;
    gamesData: GameData[] = [];
    snapshots: GameStateSnapshot[] = [];
    replayEventLayers: ReplayEventLayer[] = [];
    statesLayers: GameStateSnapshotLayer[] = [];
    // eslint-disable-next-line max-params
    constructor(
        private userService: UserService,
        private readonly gameCommunicationService: CommunicationHttpService,
        private replayHttpService: ReplayHttpService,
        public dialog: MatDialog,
    ) {
        this.getAllGames();
    }

    getAllGames() {
        this.gameCommunicationService.getAllGames().subscribe((gamesData) => {
            this.gamesData = gamesData;
        });
    }

    recordEvent(event: ReplayEvent) {
        event.username = this.userService.loggedInUser?.username ?? '';
        this.events.push(event);
    }

    setGameData(gameData: GameData) {
        this.gameData = gameData;
        this.clearSavedStates();
    }

    getReplayData(): ReplayEvent[] {
        return this.events;
    }

    loadData(data: Replay) {
        this.events = data.events;
        this.snapshots = data.snapshots;
        const g = this.gamesData.find((game) => game.name === data.gameName);
        if (g) {
            this.gameData = g;
        } else {
            this.gameCommunicationService.getGame(data.gameName).subscribe((gameData) => {
                this.gameData = gameData;
            });
        }
    }

    async convertImageDataToLayers(): Promise<void> {
        this.replayEventLayers = [];
        this.statesLayers = [];
        await this.convertEventImageDataToLayers();
        await this.convertStateImageDataToLayers();
    }

    async convertEventImageDataToLayers() {
        for (const event of this.events) {
            const layer = await this.convertEventToLayer(event);
            this.replayEventLayers.push(layer);
        }
    }

    async convertStateImageDataToLayers() {
        for (const state of this.snapshots) {
            const layer = await this.convertStateToLayer(state);
            this.statesLayers.push(layer);
        }
    }

    async convertStateToLayer(state: GameStateSnapshot): Promise<GameStateSnapshotLayer> {
        return Promise.all([this.convertImageToCanvas(state.imageData1), this.convertImageToCanvas(state.imageData2)]).then(([canvas1, canvas2]) => {
            return {
                gameRoom: state.gameRoom,
                imageData1: canvas1,
                imageData2: canvas2,
            };
        });
    }

    async convertEventToLayer(event: ReplayEvent): Promise<ReplayEventLayer> {
        return Promise.all([
            event.imageData1?.trim().length !== 0 ? this.convertImageToCanvas(event.imageData1 as string) : Promise.resolve(undefined),
            event.imageData2?.trim().length !== 0 ? this.convertImageToCanvas(event.imageData2 as string) : Promise.resolve(undefined),
            event.cheatData ? this.convertImageToCanvas(event.cheatData) : Promise.resolve(undefined),
        ]).then(([canvas1, canvas2, canvas3]) => {
            return {
                action: event.action,
                imageData1: canvas1,
                imageData2: canvas2,
                timestamp: event.timestamp,
                username: event.username,
                cheatData: canvas3,
            };
        });
    }

    async convertImageToCanvas(imageData: string): Promise<HTMLCanvasElement> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx === null) reject('Could not create canvas context');
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx?.drawImage(image, 0, 0);
                resolve(canvas);
            };
            image.src = imageData;
            image.onerror = () => {
                reject('Failed to load image');
            };
        });
    }

    recordState(snapshot: GameStateSnapshot) {
        this.snapshots.push(snapshot);
    }

    saveReplay() {
        const newReplay: NewReplay = {
            creator: this.userService.loggedInUser?._id ?? '',
            gameName: this.gameData.name,
            events: this.events,
            snapshots: this.snapshots,
        };
        this.replayHttpService.createNewReplay(newReplay).subscribe({
            next: () => {
                this.clearSavedStates();
                this.dialog.closeAll();
            },
            error: () => {
                this.dialog.open(MessageDialogComponent, {
                    panelClass: 'custom-modal',
                    data: { message: 'Erreur lors de la création de la reprise video' },
                });
            },
        });
    }

    getReplayStates() {
        return this.snapshots;
    }

    clearSavedStates() {
        this.events = [];
        this.snapshots = [];
    }
}
