import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { EndGame } from '@app/interfaces/game';
import { Vec2 } from '@app/interfaces/vec2';
import { ChatService } from '@app/services/chat/chat.service';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { VideoReplayService } from '@app/services/video-replay/video-replay.service';
import { DifferencesHashMap } from '@common/classes/differences-hashmap';
import { GameConstants } from '@common/classes/game-constants';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { GameModeEvents } from '@common/enums/game-mode.gateway.variables';
import { WaitingRoomEvents } from '@common/enums/waiting-room.gateway.variables';
import { GameMode } from '@common/game-mode';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    gameExists$ = new Subject<boolean>();
    timePosition$ = new Subject<number>();
    serverValidateResponse$ = new Subject<DifferenceTry>();
    totalDifferencesFound$ = new Subject<number>();
    userDifferencesFound$ = new Subject<number>();
    timer$ = new Subject<number>();
    gameFinished$ = new Subject<EndGame>();
    gameRoom$ = new Subject<GameRoom>();
    gameDeleted$ = new Subject<boolean>();
    abandoned$ = new Subject<string>();
    hint$ = new Subject<{ imageData: string; left: boolean }>();
    cheatModeResponse$ = new Subject<boolean>();
    gameRoom: GameRoom;
    differencesHashMap: Map<string, DifferencesHashMap[]> = new Map<string, DifferencesHashMap[]>();
    slides: GameData[];
    gameData: GameData;
    username: string;
    gameMode: string;
    gameConstants: GameConstants;
    private canSendValidate = true;

    // eslint-disable-next-line max-params
    constructor(
        readonly socketService: CommunicationSocketService,
        private chatService: ChatService,
        private communicationService: CommunicationHttpService,
        public dialog: MatDialog,
        private videoReplayService: VideoReplayService,
    ) {
        this.getConstant();
        this.getAllGames();
    }

    getIsTyping(): boolean {
        return this.chatService.getIsTyping();
    }

    getConstant(): void {
        if (this.gameRoom) {
            this.gameConstants = this.gameRoom.gameConstants;
        }
    }

    isLimitedTimeMode(): boolean {
        return this.gameMode === GameMode.limitedTimeMode;
    }

    startGame(gameRoom: GameRoom, username: string): void {
        this.gameRoom = gameRoom;
        this.username = username;
        this.gameMode = gameRoom.gameMode;
        const slide = this.getGameData(gameRoom.userGame.gameName);
        // if (!slide) {
        //     this.dialog.open(MessageDialogComponent, {
        //         panelClass: 'custom-modal',
        //         data: { message: 'Jeu introuvable' },
        //     });
        //     return;
        // }
        if (slide) {
            this.gameData = slide;
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (this.gameRoom.userGame.chosenDifference !== -1) {
            this.gameData.differenceMatrix = this.gameData.differenceHashMap[this.gameRoom.userGame.chosenDifference].differenceMatrix;
        }
        this.gameRoom$.next(this.gameRoom);
        if (this.gameRoom.userGame.creator === this.username) {
            this.socketService.send(WaitingRoomEvents.Start, this.gameRoom.roomId);
        }
        if (this.gameMode === GameMode.limitedTimeMode) {
            this.slides = this.slides.filter((game) => game.name !== this.gameData.name);
            this.gameDeletedSocket();
        }
        this.chatService.handleMessage();
        this.handleSocket();
    }

    observeGame(gameRoom: GameRoom, username: string) {
        this.gameRoom = gameRoom;
        this.username = username;
        const slide = this.getGameData(gameRoom.userGame.gameName);
        // if (!slide) {
        //     this.dialog.open(MessageDialogComponent, {
        //         panelClass: 'custom-modal',
        //         data: { message: 'Jeu introuvable' },
        //     });
        //     return;
        // }
        if (slide) {
            this.gameData = slide;
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (this.gameRoom.userGame.chosenDifference !== -1) {
            this.gameData.differenceMatrix = this.gameData.differenceHashMap[this.gameRoom.userGame.chosenDifference].differenceMatrix;
        }
        this.gameMode = gameRoom.gameMode;
        this.gameRoom$.next(this.gameRoom);
        if (this.gameMode === GameMode.limitedTimeMode) {
            this.getAllGames();
            this.gameDeletedSocket();
        }
        this.chatService.handleMessage();
        this.handleSocket();
        this.socketService.send(WaitingRoomEvents.ObservingGame, this.gameRoom);
    }

    gameDeletedSocket(): void {
        this.socketService.on(WaitingRoomEvents.GameCanceled, (gameName: string) => {
            this.slides = this.slides.filter((game) => game.name !== gameName);
        });
    }

    sendMessage(message: string, username: string): void {
        this.chatService.sendMessage(message, username, this.gameRoom.roomId);
    }

    sendServerDifference(differenceMatrix: number[][], username: string) {
        if (this.username === username) {
            this.socketService.send(GameModeEvents.SendDifference, { differenceMatrix, roomId: this.gameRoom.roomId });
        }
    }

    turnOffWaitingSocket(): void {
        this.socketService.off(WaitingRoomEvents.GameInfo);
        this.socketService.off(WaitingRoomEvents.GameCreated);
        this.socketService.off(WaitingRoomEvents.PlayerAccepted);
        this.socketService.off(WaitingRoomEvents.PlayerRejected);
        this.socketService.off(WaitingRoomEvents.GameCanceled);
    }

    turnOffGameSocket(): void {
        this.socketService.off(GameModeEvents.DifferenceValidated);
        this.socketService.off(GameModeEvents.GameFinished);
        this.socketService.off(GameModeEvents.Abandoned);
        this.socketService.off(GameModeEvents.Timer);
        this.socketService.off(GameModeEvents.CheatMode);
        this.socketService.off(GameModeEvents.NextGame);
    }

    getAllGames() {
        this.communicationService.getAllGames().subscribe((games) => {
            games.forEach((game) => {
                this.communicationService.getGame(game.name).subscribe((gameData) => {
                    game.differenceMatrix = gameData.differenceMatrix;
                    game.differenceHashMap = gameData.differenceHashMap;
                });
            });
            this.slides = games;
        });
    }

    abortGame(): void {
        if (this.socketService.isSocketAlive() && this.gameRoom.userGame.creator === this.username) {
            this.socketService.send(WaitingRoomEvents.AbortGameCreation, this.gameRoom.roomId);
        } else if (this.socketService.isSocketAlive() && this.gameRoom) {
            this.socketService.send(WaitingRoomEvents.LeaveGame, { roomId: this.gameRoom.roomId, username: this.username });
        }
    }

    sendServerValidate(differencePos: Vec2): void {
        if (!this.canSendValidate) {
            return;
        }
        this.socketService.send(GameModeEvents.ValidateDifference, {
            differencePos,
            roomId: this.gameRoom.roomId,
            username: this.username,
            validated: true,
        });
        this.canSendValidate = false;
    }

    findDifference(pos: Vec2): number[][] {
        for (const differenceHashMap of this.gameData.differenceHashMap) {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (differenceHashMap.differenceMatrix[pos.y][pos.x] !== -1) {
                return differenceHashMap.differenceMatrix;
            }
        }
        return this.gameData.differenceHashMap[0].differenceMatrix;
    }

    changeTime(number: number): void {
        if (this.socketService.isSocketAlive()) {
            this.socketService.send(GameModeEvents.ChangeTime, { roomId: this.gameRoom.roomId, time: number });
        }
    }

    reset(): void {
        this.gameRoom = undefined as unknown as GameRoom;
        this.canSendValidate = true;
        this.username = '';
        this.totalDifferencesFound$ = new Subject<number>();
        this.userDifferencesFound$ = new Subject<number>();
        this.timer$ = new Subject<number>();
        this.gameFinished$ = new Subject<EndGame>();
        this.gameRoom$ = new Subject<GameRoom>();
        this.serverValidateResponse$ = new Subject<DifferenceTry>();
        this.abandoned$ = new Subject<string>();
        this.socketService.off(WaitingRoomEvents.Started);
        this.socketService.off(GameModeEvents.DifferenceValidated);
        this.socketService.off(GameModeEvents.GameFinished);
        this.socketService.off(GameModeEvents.Abandoned);
        this.socketService.off(GameModeEvents.Timer);
        this.socketService.off(GameModeEvents.CheatMode);
        this.socketService.off(GameModeEvents.Hint);
    }

    abandonGame(): void {
        if (this.socketService.isSocketAlive() && this.gameRoom.userGame.currentPlayers?.some((player) => player.username === this.username)) {
            this.socketService.send(GameModeEvents.Abandoned, { roomId: this.gameRoom.roomId, username: this.username });
        } else if (this.socketService.isSocketAlive()) {
            this.socketService.send(GameModeEvents.ObserverLeaveGame, { roomId: this.gameRoom.roomId, username: this.username });
        }
    }

    loadNextGame(): void {
        if (this.slides.length !== 0 && this.gameRoom.userGame.creator === this.username) {
            const game = this.slides[this.generateRandomNumber(this.slides.length)];
            this.gameRoom.userGame.gameName = game.name;
            this.gameRoom.userGame.chosenDifference = this.generateRandomNumber(game.nbDifference);
            this.socketService.send(GameModeEvents.NextGame, this.gameRoom);
        } else if (this.slides.length === 0) {
            this.socketService.send(GameModeEvents.EndGame, this.gameRoom.roomId);
        }
    }

    sendHint(imageData: string, receiver: string, left: boolean): void {
        if (this.socketService.isSocketAlive()) {
            this.socketService.send(GameModeEvents.Hint, { imageData, sender: this.username, receiver, roomId: this.gameRoom.roomId, left });
        }
    }

    isCheatModeOn(): void {
        if (!this.gameRoom.gameConstants.cheatMode) {
            this.cheatModeResponse$.next(false);
        }
        this.socketService.send(GameModeEvents.CheatMode, this.gameRoom.roomId);
    }

    // private updateBestTime(gameFinished: boolean, winner: boolean): void {
    //     this.configHttpService.getBestTime(this.gameRoom.userGame.gameData.name).subscribe((bestTimes) => {
    //         if (!bestTimes) return;
    // eslint-disable-next-line max-len
    //         const actualBestTime = this.gameRoom.userGame.currentPlayers.length > 1 ? bestTimes.vsBestTimes[2].time : bestTimes.soloBestTimes[2].time;
    //         if (this.gameRoom.userGame.timer < actualBestTime && winner && gameFinished && !this.isAbandoned) {
    //             const newBestTime = new NewBestTime();
    //             newBestTime.gameName = this.gameRoom.userGame.gameData.name;
    //             newBestTime.time = this.gameRoom.userGame.timer;
    //             newBestTime.name = this.username;
    //             newBestTime.isSolo = this.gameRoom.userGame.currentPlayers.length === 1;
    //             this.configHttpService.updateBestTime(this.gameRoom.userGame.gameData.name, newBestTime).subscribe((position) => {
    //                 if (position === NOT_TOP3) return;
    //                 this.timePosition$.next(position);
    //             });
    //         }
    //     });
    // }

    private getGameData(gameName: string): GameData | undefined {
        return this.slides.find((game) => game.name === gameName);
    }

    private handleSocket(): void {
        this.socketService.on(WaitingRoomEvents.Started, () => {
            this.gameRoom$.next(this.gameRoom);
            this.videoReplayService.setGameData(this.gameData);
            this.videoReplayService.recordEvent({
                action: 'gameStart',
                imageData1: '',
                imageData2: '',
                timestamp: Date.now(),
            });
        });

        this.socketService.on(GameModeEvents.NextGame, (gameRoom: GameRoom) => {
            this.gameRoom = gameRoom;
            const slideIndex = this.slides.findIndex((game) => game.name === gameRoom.userGame.gameName);
            const slide = this.slides.splice(slideIndex, 1)[0];
            if (!slide) {
                this.dialog.open(MessageDialogComponent, {
                    panelClass: 'custom-modal',
                    data: { message: 'Problème interne du serveur, svp réessayer ' },
                });
                return;
            }
            this.gameData = slide;
            this.gameData.differenceMatrix = this.gameData.differenceHashMap[this.gameRoom.userGame.chosenDifference].differenceMatrix;
            this.gameRoom$.next(this.gameRoom);
        });

        this.socketService.on(GameModeEvents.Hint, (data: { imageData: string; sender: string; receiver: string; left: boolean }) => {
            if (
                data.receiver === this.username ||
                (data.receiver === null && !this.gameRoom.userGame.observers?.some((observer) => observer.username === this.username)) ||
                data.sender === this.username
            ) {
                this.hint$.next({ imageData: data.imageData, left: data.left });
            }
        });

        this.socketService.on(GameModeEvents.DifferenceValidated, (differenceTry: DifferenceTry) => {
            if (differenceTry.validated) {
                this.gameRoom.userGame.nbDifferenceFound++;
                this.totalDifferencesFound$.next(this.gameRoom.userGame.nbDifferenceFound);
                this.gameRoom.userGame.differenceFoundByPlayers = differenceTry.everyoneScore;
            }
            this.serverValidateResponse$.next(differenceTry);
        });

        this.socketService.on(GameModeEvents.CheatMode, (isCheatModeOn: boolean) => {
            this.cheatModeResponse$.next(isCheatModeOn);
        });

        this.socketService.on(GameModeEvents.GameFinished, (endGame: EndGame) => {
            this.gameFinished$.next(endGame);
            this.videoReplayService.recordEvent({
                action: 'gameEnd',
                imageData1: '',
                imageData2: '',
                timestamp: Date.now(),
            });
        });

        this.socketService.on(WaitingRoomEvents.ObservingGame, (gameRoom: GameRoom) => {
            this.gameRoom.userGame.observers = gameRoom.userGame.observers;
            this.gameRoom$.next(this.gameRoom);
        });

        this.socketService.on(GameModeEvents.Abandoned, (data: { gameRoom: GameRoom; username: string }) => {
            this.gameRoom = data.gameRoom;
            this.gameRoom$.next(this.gameRoom);
            this.abandoned$.next(data.username);
        });

        this.socketService.on(GameModeEvents.Timer, (timer: number) => {
            this.gameRoom.userGame.timer = timer;
            this.timer$.next(timer);
            this.canSendValidate = true;
        });
    }

    // private limitedTimeGameAbandoned(gameRoom: GameRoom): void {
    //     this.gameRoom = gameRoom;
    //     this.gameRoom$.next(this.gameRoom);
    // }

    private generateRandomNumber(nbOfDifferences: number): number {
        return Math.floor(Math.random() * nbOfDifferences);
    }
}
