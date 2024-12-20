import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { ChatButtonComponent } from '@app/components/chat-button/chat-button.component';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { ChannelData } from '@app/interfaces/channel-data';
import { GameSetupService } from '@app/services/game-setup/game-setup.service';
import { WaitingRoomService } from '@app/services/waiting-room/waiting-room.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-room-dialog',
    templateUrl: './waiting-room-dialog.component.html',
    styleUrls: ['./waiting-room-dialog.component.scss'],
})
export class WaitingRoomComponent implements OnInit, AfterViewInit {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    @Input() gameDuration: number = 60;
    @Input() bonusTime: number = 0;
    @ViewChild(MatSlideToggle, { static: false }) slideToggle: MatSlideToggle;
    rejected = false;
    accepted = false;
    gameCanceled = false;
    gameMode: string;
    chatChannel: ChannelData;
    private rejectedSubscription: Subscription;
    private acceptedSubscription: Subscription;
    private gameCanceledSubscription: Subscription;
    private isRejectionDialogOpen = false;

    // eslint-disable-next-line max-params
    constructor(
        public waitingRoomService: WaitingRoomService,
        private dialog: MatDialog,
        private dialogRef: MatDialogRef<WaitingRoomComponent>,
        private gameSetUpService: GameSetupService,
        private router: Router,
        private rejectionDialogRef: MatDialogRef<MessageDialogComponent>,
    ) {}

    ngOnInit() {
        this.gameSetUpService.refreshGamesAfterReload();
        this.gameMode = this.waitingRoomService.gameMode;
        this.waitingRoomService.reloadGames();
        this.rejectedSubscription = this.waitingRoomService.rejected$.subscribe((rejected) => {
            this.rejected = rejected;
            if (rejected) {
                if (!this.isRejectionDialogOpen) {
                    if (this.dialogRef) {
                        this.dialogRef.close();
                    }
                    this.dialog.open(MessageDialogComponent, {
                        data: { message: 'Vous avez été rejeté' },
                        panelClass: 'custom-modal',
                    });
                    this.isRejectionDialogOpen = true;
                    this.rejectionDialogRef.afterClosed().subscribe(() => {
                        this.isRejectionDialogOpen = false;
                        this.close();
                    });
                    this.router.navigate(['/selection']);
                }
            }
        });

        this.acceptedSubscription = this.waitingRoomService.accepted$.subscribe((accepted) => {
            if (accepted) {
                this.accepted = true;
                this.close();
            }
        });

        this.gameCanceledSubscription = this.waitingRoomService.gameCanceled$.subscribe((finished) => {
            if (!this.gameCanceled && finished) {
                this.gameCanceled = true;
                const dialogRef = this.dialog.open(DeleteDialogComponent, {
                    disableClose: true,
                    data: { action: 'deleted' },
                    panelClass: 'custom-modal',
                });
                if (dialogRef) {
                    dialogRef.afterClosed().subscribe(() => {
                        this.close();
                    });
                }
            }
        });
        this.chatChannel = new ChannelData(this.waitingRoomService.roomId, 'Local');
        ChatButtonComponent.forceCloseOpenChatModal();
    }

    ngAfterViewInit(): void {
        if (this.slideToggle) {
            this.slideToggle.checked = false;
        }
    }

    playerAccepted(player: string, isAndroid: boolean): void {
        this.waitingRoomService.playerAccepted(player, isAndroid);
    }

    playerRejected(player: string): void {
        this.waitingRoomService.playerRejected(player);
    }

    isUsernameNotInCurrentPlayers(): boolean {
        if (!this.waitingRoomService.gameRoom?.userGame?.currentPlayers) {
            return true;
        }
        return !this.waitingRoomService.gameRoom.userGame.currentPlayers.some((player) => player.username === this.waitingRoomService?.username);
    }

    close() {
        this.acceptedSubscription.unsubscribe();
        this.rejectedSubscription.unsubscribe();
        this.gameCanceledSubscription.unsubscribe();
        this.waitingRoomService.removeSocketListeners();
        this.dialogRef.close();
        if (!this.accepted) {
            this.waitingRoomService.abortGame();
        }
        ChatButtonComponent.forceCloseOpenChatModal();
    }

    start() {
        this.accepted = true;
        this.waitingRoomService.gameRoom.gameConstants = {
            gameDuration: this.gameDuration,
            bonusTime: this.bonusTime,
            penaltyTime: 0,
            cheatMode: this.slideToggle.checked,
        };
        this.waitingRoomService.startGame();
        this.close();
    }
}
