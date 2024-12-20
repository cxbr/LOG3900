import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EndgameDialogComponent } from '@app/components/endgame-dialog/endgame-dialog.component';
import { ChannelData } from '@app/interfaces/channel-data';
import { EndGame } from '@app/interfaces/game';
import { GameService } from '@app/services/game/game.service';
import { PlayAreaService } from '@app/services/play-area/play-area.service';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { GameMode } from '@common/game-mode';
import { Subscription } from 'rxjs';
import { Time } from 'src/assets/variables/time';
@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    gameName: string;
    username: string;
    timer = 0;
    totalDifferencesFound = 0;
    userDifferencesFound = 0;
    gameRoom: GameRoom;
    gameData: GameData;
    chatChannel: ChannelData;
    hintNum = 0;
    nbObservers = 0;
    penaltyTime: number;
    selectedPlayer: string | null = null;
    isObserver: boolean = false;
    color = 'white';

    private gameFinished = false;
    private abandoned = false;
    private dialogRef: MatDialogRef<EndgameDialogComponent>;
    private timerSubscription: Subscription;
    private differencesFoundSubscription: Subscription;
    private userDifferencesFoundSubscription: Subscription;
    private gameFinishedSubscription: Subscription;
    private gameRoomSubscription: Subscription;
    private hintSubscription: Subscription;
    private abandonedGameSubscription: Subscription;

    // eslint-disable-next-line max-params
    constructor(private dialog: MatDialog, private gameService: GameService, private router: Router, private playAreaService: PlayAreaService) {}

    ngOnInit() {
        this.gameService.getConstant();
        this.gameData = this.gameService.gameData;
        this.subscribeTimer();
        this.penaltyTime = this.gameService.gameConstants.penaltyTime;
        this.subscribeTotalDifferencesFound();
        this.subscribeUserDifferencesFound();
        this.subscribeGameFinished();
        this.subscribeAbandon();
        this.subscribeGameRoom();
        this.subscribeHint();
    }

    endGame(endGame: EndGame) {
        if (this.gameRoom.gameMode === GameMode.classicMode) {
            this.endGameClassicMode(endGame);
        } else {
            this.endGameLimitedTimeMode();
        }
    }

    abandonGame() {
        this.abandonConfirmation();
    }

    endGameClassicMode(endGame: EndGame) {
        if (endGame.winner === this.username) {
            this.dialogRef = this.dialog.open(EndgameDialogComponent, {
                disableClose: true,
                data: { gameFinished: true, won: true, tied: false, lost: false, time: this.timer },
                panelClass: 'custom-modal',
            });
            this.playAreaService.startConfetti(undefined);
        } else if (endGame.tiedPlayers.includes(this.username)) {
            this.dialogRef = this.dialog.open(EndgameDialogComponent, {
                disableClose: true,
                data: { gameFinished: true, won: false, tied: true, lost: false },
                panelClass: 'custom-modal',
            });
        } else if (this.gameRoom.userGame.observers?.some((observer) => observer.username === this.username)) {
            this.dialogRef = this.dialog.open(EndgameDialogComponent, {
                disableClose: true,
                data: { gameFinished: true, won: false, tied: false, lost: false, observer: true },
                panelClass: 'custom-modal',
            });
        } else {
            this.dialogRef = this.dialog.open(EndgameDialogComponent, {
                disableClose: true,
                data: { gameFinished: true, won: false, tied: false, lost: true },
                panelClass: 'custom-modal',
            });
        }
        this.unsubscribe();
    }

    endGameLimitedTimeMode() {
        this.unsubscribe();
        if (this.gameRoom.userGame.observers?.some((observer) => observer.username === this.username)) {
            this.dialogRef = this.dialog.open(EndgameDialogComponent, {
                disableClose: true,
                data: { gameFinished: true, won: false, tied: false, lost: false, observer: true },
                panelClass: 'custom-modal',
            });
        } else {
            this.dialogRef = this.dialog.open(EndgameDialogComponent, {
                disableClose: true,
                data: { gameFinished: true, gameWinner: true, limitedTimeMode: true },
                panelClass: 'custom-modal',
            });
        }
    }

    sendHint(data: { imageData: string; left: boolean }) {
        this.gameService.sendHint(data.imageData, this.selectedPlayer as unknown as string, data.left);
    }

    getSelectedPlayer(data: string | null) {
        this.selectedPlayer = data;
    }

    ngOnDestroy() {
        if (!this.gameFinished || this.abandoned) {
            this.gameService.abandonGame();
        }
        this.unsubscribe();
        setTimeout(() => {
            this.gameService.reset();
            this.dialog.closeAll();
            this.playAreaService.clearAsync();
        }, Time.Thousand);
    }

    private abandonConfirmation() {
        this.dialogRef = this.dialog.open(EndgameDialogComponent, {
            data: { gameFinished: false, gameWinner: false },
            panelClass: 'custom-modal',
        });
        if (this.dialogRef) {
            this.dialogRef.afterClosed().subscribe((abandon) => {
                if (abandon) {
                    this.gameService.abandonGame();
                    this.unsubscribe();
                    this.abandoned = true;
                    setTimeout(() => {
                        this.router.navigate(['/home']);
                    }, Time.Thousand);
                }
            });
        }
    }

    private subscribeTotalDifferencesFound() {
        this.differencesFoundSubscription = this.gameService.totalDifferencesFound$.subscribe((count) => {
            this.totalDifferencesFound = count;
        });
    }

    private subscribeUserDifferencesFound() {
        this.userDifferencesFoundSubscription = this.gameService.userDifferencesFound$.subscribe((count) => {
            this.userDifferencesFound = count;
        });
    }

    private subscribeTimer() {
        this.timerSubscription = this.gameService.timer$.subscribe((timer: number) => {
            this.timer = timer;
        });
    }

    private subscribeGameFinished() {
        this.gameFinishedSubscription = this.gameService.gameFinished$.subscribe((endGame: EndGame) => {
            this.gameFinished = true;
            this.endGame(endGame);
            setTimeout(() => {
                this.playAreaService.clearReplayInterval();
            });
        });
    }

    private subscribeAbandon() {
        this.abandonedGameSubscription = this.gameService.abandoned$.subscribe((username: string) => {
            if (username === this.username) {
                this.unsubscribe();
                return;
            }

            const isClassicMode = this.gameService.gameMode === GameMode.classicMode;
            const isCurrentUserInGame = this.isCurrentUserInGame();
            const shouldDisplayEndgame = this.gameService.gameRoom.userGame.currentPlayers.length === 1;

            if (shouldDisplayEndgame) {
                const gameData = this.getGameData(isClassicMode, isCurrentUserInGame);
                this.showEndgameDialog(gameData);
                if (isClassicMode && isCurrentUserInGame) {
                    this.playAreaService.startConfetti(undefined);
                }
                this.unsubscribe();
            }
        });
    }

    private isCurrentUserInGame(): boolean {
        return this.gameService.gameRoom.userGame.currentPlayers.some((p) => p.username === this.username);
    }

    private getGameData(isClassicMode: boolean, isCurrentUserInGame: boolean) {
        if (isClassicMode && isCurrentUserInGame) {
            return { gameFinished: true, won: true };
        } else if (isCurrentUserInGame) {
            return { gameFinished: true, gameWinner: true, limitedTimeMode: true };
        }
        return { gameFinished: true, gameWinner: false, observer: true };
    }

    private showEndgameDialog(data: unknown) {
        this.dialogRef = this.dialog.open(EndgameDialogComponent, {
            disableClose: true,
            data,
            panelClass: 'custom-modal',
        });
    }

    private subscribeGameRoom() {
        this.gameRoomSubscription = this.gameService.gameRoom$.subscribe((gameRoom) => {
            this.gameRoom = gameRoom;
            this.chatChannel = new ChannelData(gameRoom.roomId, 'Local');
            this.gameData = this.gameService.gameData;
            this.username = this.gameService.username;
            this.gameName = gameRoom.userGame.gameName;
            this.nbObservers = gameRoom.userGame.observers?.length ?? 0;
            this.isObserver = this.gameRoom.userGame.observers?.some((observer) => observer.username === this.username) ?? false;
            if (this.isObserver) {
                this.color = this.gameRoom.userGame.observers?.find((observer) => observer.username === this.username)?.color ?? 'white';
            }
        });
    }
    private subscribeHint() {
        this.hintSubscription = this.gameService.hint$.subscribe((data: { imageData: string; left: boolean }) => {
            this.playAreaService.playObserverHint(data.imageData, data.left);
        });
    }

    private unsubscribe() {
        this.timerSubscription.unsubscribe();
        this.differencesFoundSubscription.unsubscribe();
        this.userDifferencesFoundSubscription.unsubscribe();
        this.gameFinishedSubscription.unsubscribe();
        this.gameRoomSubscription.unsubscribe();
        this.abandonedGameSubscription.unsubscribe();
        this.hintSubscription.unsubscribe();
    }
}
