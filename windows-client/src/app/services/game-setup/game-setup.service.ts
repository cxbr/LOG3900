import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { WaitingRoomService } from '@app/services/waiting-room/waiting-room.service';
import { GameConstants } from '@common/classes/game-constants';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { GameModeEvents } from '@common/enums/game-mode.gateway.variables';
import { GameMode } from '@common/game-mode';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameSetupService {
    username: string;
    gameRoom: GameRoom;
    gameConstants: GameConstants;
    gameMode: string;
    gameRoom$ = new Subject<GameRoom>();
    tokenKey = 'token';
    private slides: GameData[] = [];

    constructor(
        private readonly socketService: CommunicationSocketService,
        private communicationService: CommunicationHttpService,
        private waitingRoomService: WaitingRoomService,
        public dialog: MatDialog,
    ) {
        this.refreshGamesAfterReload();
        this.subscribeToGameDeletedEvent();
    }

    refreshGamesAfterReload() {
        this.getAllGames();
    }

    setConstants(constants: GameConstants): void {
        this.gameConstants = constants;
    }

    subscribeToGameDeletedEvent() {
        this.socketService.on(GameModeEvents.GameDeletedFromDB, (gameName: string) => {
            this.slides = this.slides.filter((game) => game.name !== gameName);
        });
    }

    getAllGames() {
        this.communicationService.getAllGames().subscribe((games) => {
            this.slides = games;
        });
    }

    getSlides(): GameData[] {
        return this.slides;
    }

    initGameRoom(started: boolean): void {
        this.username = localStorage.getItem(this.tokenKey) || '';
        this.gameRoom = {
            userGame: {
                gameName: undefined as unknown as string,
                nbDifferenceFound: 0,
                differenceFoundByPlayers: [{ username: this.username, differencesFound: 0 }],
                timer: 0,
                creator: this.username,
                chosenDifference: -1,
                currentPlayers: [
                    {
                        username: this.username,
                        isAndroid: false,
                    },
                ],
                observers: [],
            },
            roomId: this.generateRandomId(),
            started,
            gameMode: this.gameMode,
            gameConstants: undefined as unknown as GameConstants,
        };
    }

    initGameMode(gameName = undefined as unknown as string): boolean {
        let gameFound = true;
        if (gameName) {
            gameFound = this.initClassicMode(gameName);
        } else {
            gameFound = this.initLimitedTimeMode();
        }
        this.socketService.off(GameModeEvents.GameDeletedFromDB);
        return gameFound;
    }

    initClassicMode(gameName: string): boolean {
        // const slide = this.getGameData(gameName);
        // if (!slide) {
        //     this.dialog.open(MessageDialogComponent, {
        //         panelClass: 'custom-modal',
        //         data: { message: 'Jeu introuvable' },
        //     });
        //     return false;
        // }
        this.gameRoom.userGame.gameName = gameName;
        this.waitingRoomService.createGame(this.gameRoom);
        return true;
    }

    initLimitedTimeMode(): boolean {
        const gameData = this.randomSlide();
        // if (!gameData) {
        //     this.dialog.open(MessageDialogComponent, {
        //         panelClass: 'custom-modal',
        //         data: { message: 'Jeu introuvable' },
        //     });
        //     return false;
        // }
        this.gameRoom.userGame.gameName = gameData.name;
        this.gameRoom.userGame.chosenDifference = this.generateRandomNumber(gameData.nbDifference);
        this.waitingRoomService.createGame(this.gameRoom);
        return true;
    }

    joinGame(gameName = undefined as unknown as string, roomId: string): void {
        this.username = localStorage.getItem(this.tokenKey) || '';
        if (this.gameMode === GameMode.classicMode) {
            this.joinClassicMode(gameName, roomId);
        } else {
            this.joinLimitedTimeMode(roomId);
        }
        this.socketService.off(GameModeEvents.GameDeletedFromDB);
    }

    joinClassicMode(gameName: string, roomId: string): void {
        // const slide = this.getGameData(gameName);
        // if (!slide) {
        //     this.dialog.open(MessageDialogComponent, {
        //         panelClass: 'custom-modal',
        //         data: { message: 'Jeu introuvable' },
        //     });
        //     return;
        // }
        this.waitingRoomService.joinGame(this.username, this.gameMode, roomId, gameName);
    }

    joinLimitedTimeMode(roomId: string): void {
        this.waitingRoomService.joinGame(this.username, this.gameMode, roomId);
    }

    observeGame(gameName = undefined as unknown as string, roomId: string): void {
        this.username = localStorage.getItem(this.tokenKey) || '';
        if (this.gameMode === GameMode.classicMode) {
            this.observeClassicMode(gameName, roomId);
        } else {
            this.observerLimitedTimeMode(roomId);
        }
        this.socketService.off(GameModeEvents.GameDeletedFromDB);
    }

    observeClassicMode(gameName: string, roomId: string): void {
        // const slide = this.getGameData(gameName);
        // if (!slide) {
        //     this.dialog.open(MessageDialogComponent, {
        //         panelClass: 'custom-modal',
        //         data: { message: 'Jeu introuvable' },
        //     });
        //     return;
        // }
        this.waitingRoomService.observeGame(this.username, this.gameMode, roomId, gameName);
    }

    observerLimitedTimeMode(roomId: string): void {
        this.waitingRoomService.observeGame(this.username, this.gameMode, roomId);
    }

    private randomSlide(): GameData {
        return this.slides[Math.floor(Math.random() * this.slides.length)];
    }

    // private getGameData(gameName: string): GameData | undefined {
    //     return this.slides.find((game) => game.name === gameName);
    // }

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private generateRandomId(length = 16): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomId = '';
        for (let i = 0; i < length; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return randomId;
    }

    private generateRandomNumber(nbOfdifferences: number): number {
        return Math.floor(Math.random() * nbOfdifferences);
    }
}
