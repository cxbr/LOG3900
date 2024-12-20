import { Component, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { GameHistory } from '@app/interfaces/game';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { UserService } from '@app/services/user/user.service';
import { DeleteDialogAction } from 'src/assets/variables/delete-dialog-action';

@Component({
    selector: 'app-game-history',
    templateUrl: './game-history.component.html',
    styleUrls: ['./game-history.component.scss'],
})
export class GameHistoryComponent {
    @Input() dialogRef: MatDialogRef<DeleteDialogComponent>;

    parties: GameHistory[] = [];
    isGameAbandoned: boolean[];
    isGameWon: boolean[];
    isLimitedTimeModePlayed: boolean[];
    isGameLost: boolean[];

    constructor(private dialog: MatDialog, private configCommunicationService: ConfigHttpService, private userService: UserService) {
        this.getPartiesFromServer();
    }

    deleteParties(): void {
        const userId = this.userService.loggedInUser?._id || '';
        this.dialogRef = this.dialog.open(DeleteDialogComponent, {
            data: { action: DeleteDialogAction.DeleteHistory },
            panelClass: 'custom-modal',
        });
        if (this.dialogRef) {
            this.dialogRef.afterClosed().subscribe((supp) => {
                if (supp) {
                    this.configCommunicationService.deleteGameHistory(userId || '').subscribe();
                    this.parties = this.parties.filter((party) => party.deletedByUsers?.includes(userId));
                }
            });
        }
    }

    calculateTime(time: number) {
        const secondsInMinute = 60;
        const factorThousant = 1000;
        const secondsTotal = Math.round(time / factorThousant);
        const minutes = Math.round(secondsTotal / secondsInMinute)
            .toString()
            .padStart(2, '0');
        const seconds = (secondsTotal % secondsInMinute).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    private getPartiesFromServer(): void {
        const userId = this.userService.loggedInUser?._id || '';
        this.configCommunicationService.getGameHistory(userId).subscribe((res) => {
            this.parties = res.reverse();
            this.setGameWinners();
        });
    }

    private setGameWinners(): void {
        this.isGameAbandoned = new Array(this.parties.length).fill(false);
        this.isGameWon = new Array(this.parties.length).fill(false);
        this.isLimitedTimeModePlayed = new Array(this.parties.length).fill(false);
        this.isGameLost = new Array(this.parties.length).fill(false);
        if (this.parties.length > 0) {
            for (let i = 0; i < this.parties.length; i++) {
                this.isGameWon[i] =
                    this.parties[i].winner === this.userService.loggedInUser?._id ||
                    (!this.parties[i].abandoned?.includes(this.userService.loggedInUser?._id || '') &&
                        this.parties[i].players.length === (this.parties[i].abandoned?.length || 0) + 1);
                this.isGameAbandoned[i] = this.parties[i].abandoned?.includes(this.userService.loggedInUser?._id || '') || false;
                this.isLimitedTimeModePlayed[i] = this.parties[i].gameMode === 'Mode Temps Limité';
                this.isGameLost[i] =
                    !this.isLimitedTimeModePlayed[i] &&
                    this.parties[i].winner !== undefined &&
                    this.parties[i].winner !== this.userService.loggedInUser?._id;
            }
        }
    }
}
