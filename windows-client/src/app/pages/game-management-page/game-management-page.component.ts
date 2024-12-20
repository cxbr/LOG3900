import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { GameData } from '@common/classes/game-data';
import { DeleteDialogAction } from 'src/assets/variables/delete-dialog-action';
import { PageKeys, slideConfig } from 'src/assets/variables/game-card-options';

@Component({
    selector: 'app-game-management-page',
    templateUrl: './game-management-page.component.html',
    styleUrls: ['./game-management-page.component.scss'],
})
export class GameManagementPageComponent {
    @ViewChild('table-container', { static: true }) table: ElementRef;

    noGames: boolean = false;
    pageType: PageKeys = PageKeys.Management;
    imgSource: string;
    slides: GameData[];
    slideConfig = slideConfig;

    private dialogRef: MatDialogRef<DeleteDialogComponent>;

    // eslint-disable-next-line max-params
    constructor(
        private readonly gameCommunicationService: CommunicationHttpService,
        private dialog: MatDialog,
        private configCommunicationService: ConfigHttpService,
        private router: Router,
    ) {
        this.getSlidesFromServer();
    }

    deleteNotify(name: string): void {
        this.dialogRef = this.dialog.open(DeleteDialogComponent, {
            disableClose: true,
            data: { action: DeleteDialogAction.Delete },
            panelClass: 'custom-modal',
        });
        if (this.dialogRef) {
            this.dialogRef.afterClosed().subscribe((supp: boolean) => {
                if (supp) {
                    this.removeSlide(name);
                    this.router.navigate(['/game-management']).then(() => {
                        this.router.navigateByUrl('/game-management', { skipLocationChange: true });
                    });
                }
            });
        }
    }

    resetNotify(name: string): void {
        this.dialogRef = this.dialog.open(DeleteDialogComponent, { disableClose: true, data: { action: DeleteDialogAction.Reset } });
        if (this.dialogRef) {
            this.dialogRef.afterClosed().subscribe((reset: boolean) => {
                if (reset) {
                    this.configCommunicationService.deleteBestTime(name).subscribe();
                    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                        this.router.navigate(['/game-management']);
                    });
                }
            });
        }
    }

    renameNotify(data: { oldName: string; newName: string }): void {
        this.gameCommunicationService.renameGame(data).subscribe();
    }

    resetBestTimes() {
        this.dialogRef = this.dialog.open(DeleteDialogComponent, { disableClose: true, data: { action: DeleteDialogAction.ResetAll } });
        if (this.dialogRef) {
            this.dialogRef.afterClosed().subscribe((reset: boolean) => {
                if (reset) {
                    this.configCommunicationService.deleteBestTimes().subscribe();
                    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                        this.router.navigate(['/game-management']);
                    });
                }
            });
        }
    }

    deleteAllGames(): void {
        this.dialogRef = this.dialog.open(DeleteDialogComponent, {
            disableClose: true,
            data: { action: DeleteDialogAction.DeleteAll },
            panelClass: 'custom-modal',
        });
        if (this.dialogRef) {
            this.dialogRef.afterClosed().subscribe((supp: boolean) => {
                if (supp) {
                    this.gameCommunicationService.deleteAllGames().subscribe();
                    this.slides = [];
                    this.router.navigate(['/game-management']).then(() => {
                        this.router.navigateByUrl('/game-management', { skipLocationChange: true });
                    });
                }
            });
        }
    }

    setSelected(name: string): void {
        for (const slide of this.slides) {
            slide.isSelected = slide.name === name;
        }
    }

    private getSlidesFromServer(): void {
        this.gameCommunicationService.getAllGames().subscribe((res: GameData[]) => {
            if (res.length === 0) {
                this.noGames = true;
            }
            this.slides = res;
            for (const slide of this.slides) {
                slide.isSelected = false;
            }
        });
    }

    private removeSlide(name: string) {
        this.gameCommunicationService.deleteGame(name).subscribe();
        this.slides = this.slides.filter((slide) => slide.name !== name);
    }
}
