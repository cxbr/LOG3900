import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { GameRoom } from '@common/classes/game-room';
import { WaitingRoomEvents } from '@common/enums/waiting-room.gateway.variables';
import { GameMode } from '@common/game-mode';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WaitingRoomService {
    rejected$ = new Subject<boolean>();
    accepted$ = new Subject<boolean>();
    gameCanceled$ = new Subject<boolean>();
    gameRoom: GameRoom;
    roomId: string;
    username: string;
    gameMode: string;

    // eslint-disable-next-line max-params
    constructor(
        private router: Router,
        private readonly socketService: CommunicationSocketService,
        private gameService: GameService,
        public dialog: MatDialog,
    ) {}

    reloadGames() {
        this.gameService.gameMode = this.gameMode;
    }

    playerRejected(player: string): void {
        if (this.socketService.isSocketAlive()) {
            this.socketService.send(WaitingRoomEvents.RejectPlayer, { roomId: this.gameRoom.roomId, username: player });
        }
    }

    playerAccepted(player: string, isAndroid: boolean): void {
        if (this.socketService.isSocketAlive()) {
            this.socketService.send(WaitingRoomEvents.AcceptPlayer, { roomId: this.gameRoom.roomId, username: player, isAndroid });
        }
    }

    abortGame(): void {
        if (this.socketService.isSocketAlive() && this.gameRoom?.userGame.creator === this.username) {
            this.socketService.send(WaitingRoomEvents.AbortGameCreation, this.gameRoom.roomId);
        } else if (this.socketService.isSocketAlive() && this.gameRoom) {
            this.socketService.send(WaitingRoomEvents.LeaveGame, { roomId: this.gameRoom.roomId, username: this.username });
        }
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate([this.gameMode === GameMode.classicMode ? '/selection' : '/home']);
        });
    }

    startGame(): void {
        this.gameRoom.userGame.timer = this.gameRoom.gameConstants.gameDuration;
        if (this.gameRoom.userGame.creator === this.username) {
            this.socketService.send(WaitingRoomEvents.StartingGame, this.gameRoom);
        }
    }

    createGame(gameRoom: GameRoom): void {
        this.gameRoom = gameRoom;
        this.username = this.gameRoom.userGame.creator;
        this.gameMode = this.gameRoom.gameMode;
        this.roomId = gameRoom.roomId;
        this.handleWaitingRoomSocket();
        this.socketService.send(WaitingRoomEvents.CreateGame, this.gameRoom);
    }

    // TODO: refactor this
    // eslint-disable-next-line max-params
    joinGame(username: string, gameMode: string, roomId: string, gameName = undefined as unknown as string): void {
        this.gameRoom = undefined as unknown as GameRoom;
        this.username = username;
        this.gameMode = gameMode;
        this.roomId = roomId;
        const user = {
            username,
            isAndroid: false,
        };
        this.handleWaitingRoomSocket();
        this.socketService.send(WaitingRoomEvents.AskingToJoinGame, { gameName, user, gameMode, roomId });
    }

    observeGame(username: string, gameMode: string, roomId: string, gameName = undefined as unknown as string): void {
        this.gameRoom = undefined as unknown as GameRoom;
        this.username = username;
        this.gameMode = gameMode;
        this.roomId = roomId;
        const user = {
            username,
            isAndroid: false,
        };
        this.handleWaitingRoomSocket();
        this.socketService.send(WaitingRoomEvents.AskingToObserveGame, { gameName, user, gameMode, roomId });
    }

    handleWaitingRoomSocket(): void {
        this.socketService.on(WaitingRoomEvents.StartingGame, (gameRoom: GameRoom) => {
            if (gameRoom && gameRoom.userGame.currentPlayers.some((player) => player.username === this.username)) {
                this.gameRoom = gameRoom;
                this.accepted$.next(true);
                this.gameRoom.started = true;
                this.gameService.startGame(this.gameRoom, this.username);
                this.removeSocketListeners();
                this.socketService.off(WaitingRoomEvents.StartingGame);
                this.router.navigate(['/game']);
            } else if (gameRoom) {
                this.rejected$.next(true);
            }
            this.socketService.off(WaitingRoomEvents.StartingGame);
        });

        this.socketService.on(WaitingRoomEvents.GameInfo, (gameRoom: GameRoom) => {
            if (
                gameRoom &&
                (!this.gameRoom || this.gameRoom.userGame.gameName === gameRoom.userGame.gameName) &&
                this.gameMode === gameRoom.gameMode
            ) {
                this.gameRoom = gameRoom;
                if (this.gameRoom.userGame.observers?.some((observer) => observer.username === this.username)) {
                    this.gameService.observeGame(this.gameRoom, this.username);
                    this.removeSocketListeners();
                    this.socketService.off(WaitingRoomEvents.StartingGame);
                    this.router.navigate(['/game']);
                }
            } else if (!gameRoom) {
                this.dialog.open(MessageDialogComponent, {
                    panelClass: 'custom-modal',
                    data: { message: 'Nous avons eu un problème pour obtenir les informations de jeu du serveur' },
                });
            }
        });

        this.socketService.on(WaitingRoomEvents.PlayerAccepted, (gameRoom: GameRoom) => {
            this.gameRoom = gameRoom;
        });

        this.socketService.on(WaitingRoomEvents.PlayerRejected, (gameRoom: GameRoom) => {
            if (
                gameRoom &&
                !gameRoom.userGame.currentPlayers.some((player) => player.username === this.username) &&
                !gameRoom.userGame.potentialPlayers?.some((player) => player.username === this.username)
            ) {
                this.rejected$.next(true);
            } else if (gameRoom) {
                this.gameRoom = gameRoom;
            }
        });

        this.socketService.on(WaitingRoomEvents.GameCanceled, (gameRoom: GameRoom) => {
            if (
                this.gameRoom?.userGame.gameName === gameRoom?.userGame.gameName &&
                this.gameRoom.gameMode === this.gameMode &&
                (gameRoom.userGame.currentPlayers.some((player) => player.username === this.username) ||
                    gameRoom.userGame.potentialPlayers?.some((player) => player.username === this.username))
            ) {
                this.gameCanceled$.next(true);
            }
        });

        this.socketService.on(WaitingRoomEvents.GameDeleted, (gameName: string) => {
            if (this.gameMode === GameMode.limitedTimeMode) {
                this.gameService.slides = this.gameService.slides.filter((slide) => slide.name !== gameName);
                if (this.gameService.slides.length === 0) {
                    this.gameCanceled$.next(true);
                }
            } else if (this.gameRoom.userGame.gameName === gameName) {
                this.gameCanceled$.next(true);
            }
        });
    }

    removeSocketListeners(): void {
        this.socketService.off(WaitingRoomEvents.GameInfo);
        this.socketService.off(WaitingRoomEvents.GameCreated);
        this.socketService.off(WaitingRoomEvents.PlayerAccepted);
        this.socketService.off(WaitingRoomEvents.PlayerRejected);
        this.socketService.off(WaitingRoomEvents.GameCanceled);
        this.socketService.off(WaitingRoomEvents.GameDeleted);
    }
}
