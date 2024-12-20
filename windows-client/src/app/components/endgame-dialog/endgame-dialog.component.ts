/* eslint-disable @typescript-eslint/member-ordering */
import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReviewModalComponent } from '@app/components/review-modal/review-modal.component';
import { VideoReplayDialogComponent } from '@app/components/video-replay-dialog/video-replay-dialog.component';
import { GameService } from '@app/services/game/game.service';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-endgame-modal-dialog',
    templateUrl: './endgame-dialog.component.html',
    styleUrls: ['./endgame-dialog.component.scss'],
})
export class EndgameDialogComponent implements OnInit {
    @Input() bestTimeMessage: string;
    private time: string;
    private timePosition: string;
    userRating: number = 0;

    // eslint-disable-next-line max-params
    constructor(
        public gameService: GameService,
        private videoReplayDialog: MatDialog,
        private reviewDialog: MatDialog,
        private dialogRef: MatDialogRef<EndgameDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            gameFinished: boolean;
            won: boolean;
            tied: boolean;
            lost: boolean;
            observer?: boolean;
            time?: number;
            limitedTimeMode?: boolean;
        },
    ) {}

    ngOnInit() {
        if (!this.data.gameFinished) return;
        if (this.data.won) {
            if (this.data.time) {
                this.time = `${Math.floor(this.data.time / Time.Sixty)}:${(this.data.time % Time.Sixty).toLocaleString('en-US', {
                    minimumIntegerDigits: 2,
                    useGrouping: false,
                })}`;
            }
            this.gameService.timePosition$.subscribe((timePosition: number) => {
                timePosition++;
                if (timePosition === 1) this.timePosition = `${timePosition}ere`;
                else this.timePosition = `${timePosition}eme`;
                this.bestTimeMessage = `Nouveau record de temps !
                                        Vous avez effectué un temps de ${this.time} et prenez la ${this.timePosition} place !`;
            });
        }
    }

    emitAbandon(abandon: boolean) {
        this.dialogRef.close(abandon);
    }

    openVideoReplay() {
        const dialogRef = this.videoReplayDialog.open(VideoReplayDialogComponent, {
            disableClose: true,
            width: '95%',
            height: '95%',
            panelClass: 'custom-modal',
            autoFocus: false,
        });
        if (dialogRef) {
            dialogRef.afterOpened().subscribe(() => {
                const buttons = document.querySelectorAll('.button-style');
                if (buttons.length > 0) {
                    (buttons[0] as HTMLButtonElement).focus();
                }
            });
            dialogRef.afterClosed().subscribe(() => {
                this.openReview();
            });
        }
    }

    openReview() {
        this.dialogRef.close();
        const dialogRef = this.reviewDialog.open(ReviewModalComponent, {
            disableClose: true,
            height: '28%',
            panelClass: 'custom-modal',
            autoFocus: false,
        });
        if (dialogRef) {
            dialogRef.afterOpened().subscribe(() => {
                const buttons = document.querySelectorAll('.button-style');
                if (buttons.length > 0) {
                    (buttons[0] as HTMLButtonElement).focus();
                }
            });
        }
    }
}
