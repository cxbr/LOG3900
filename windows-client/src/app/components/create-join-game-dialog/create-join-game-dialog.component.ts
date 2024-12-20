import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChatButtonComponent } from '@app/components/chat-button/chat-button.component';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { GameFinderService } from '@app/services/game-finder/game-finder.service';
import { GameSetupService } from '@app/services/game-setup/game-setup.service';
import { GameService } from '@app/services/game/game.service';
import { GameRoom } from '@common/classes/game-room';
import { GameMode } from '@common/game-mode';
@Component({
    selector: 'app-create-join-game-dialog',
    templateUrl: './create-join-game-dialog.component.html',
    styleUrls: ['./create-join-game-dialog.component.scss'],
})
export class CreateJoinGameDialogComponent implements OnInit {
    games: GameRoom[] = [];
    gameLoaded: boolean = false;
    // eslint-disable-next-line max-params
    constructor(
        private dialog: MatDialog,
        private gameSetupService: GameSetupService,
        private gameFinder: GameFinderService,
        private gameService: GameService,
        private dialogRef: MatDialogRef<CreateJoinGameDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: { gameName: string; gameMode: GameMode },
    ) {}

    ngOnInit(): void {
        this.gameService.getAllGames();
        this.gameFinder.gameMode = this.data.gameMode;
        this.gameSetupService.gameMode = this.data.gameMode;
        this.gameSetupService.getAllGames();
        this.gameFinder.getGames(this.data.gameName).subscribe((games) => {
            this.games = games;
            this.gameLoaded = true;
        });
        ChatButtonComponent.forceCloseOpenChatModal();
    }
    createGame() {
        if (this.gameLoaded && this.gameSetupService.getSlides().length === 0 && this.data.gameMode === GameMode.limitedTimeMode) {
            this.dialog.open(MessageDialogComponent, {
                panelClass: 'custom-modal',
                data: { message: 'Veuillez créer un jeu' },
            });
            return;
        }
        this.gameSetupService.initGameRoom(false);
        const gameFound = this.gameSetupService.initGameMode(this.data.gameName);
        this.dialogRef.close();
        if (gameFound) {
            this.dialog.open(WaitingRoomComponent, { disableClose: true, width: '80%', height: '80%', panelClass: 'custom-modal' });
        }
    }

    joinGame(roomId: string) {
        this.gameSetupService.joinGame(this.data.gameName, roomId);
        this.dialogRef.close();
        this.dialog.open(WaitingRoomComponent, { disableClose: true, width: '80%', height: '80%', panelClass: 'custom-modal' });
    }

    observeGame(roomId: string) {
        this.gameSetupService.observeGame(this.data.gameName, roomId);
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }
}
