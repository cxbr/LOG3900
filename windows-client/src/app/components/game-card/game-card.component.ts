/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateJoinGameDialogComponent } from '@app/components/create-join-game-dialog/create-join-game-dialog.component';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { RenameDialogComponent } from '@app/components/rename-dialog/rename-dialog.component';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { UserHttpService } from '@app/services/user-http/user-http.service';
import { UserService } from '@app/services/user/user.service';
import { GameData } from '@common/classes/game-data';
import { GameRating } from '@common/classes/game-rating';
import { GameMode } from '@common/game-mode';
import { PageKeys, options } from 'src/assets/variables/game-card-options';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
})
export class GameCardComponent implements OnInit, OnDestroy {
    @Input() page: PageKeys;
    @Input() slide: GameData;

    @Output() notify = new EventEmitter();
    @Output() deleteNotify = new EventEmitter();
    @Output() resetNotify = new EventEmitter();
    @Output() renameNotify = new EventEmitter();
    @Output() notifySelected = new EventEmitter<string>();

    routeOne: string;
    btnOne: string;
    routeTwo: string;
    btnTwo: string;
    numberOfReviews: number;
    averageReviews: number;
    stars: string[] = [];

    username: string;
    isCreator: boolean = false;
    soloBestTime: { name: string; time: string }[];
    vsBestTime: { name: string; time: string }[];
    private dialogRef: MatDialogRef<WaitingRoomComponent>;
    private dialogRef2: MatDialogRef<CreateJoinGameDialogComponent>;

    // eslint-disable-next-line max-params
    constructor(
        private userHttpService: UserHttpService,
        private dialog: MatDialog,
        private userService: UserService,
        private communicationService: CommunicationHttpService,
    ) {}

    ngOnInit() {
        this.setRoutes();
        this.setBestTimes();
        if (this.slide.creator) {
            this.userHttpService.getUsername(this.slide.creator).subscribe((username: string) => {
                if (username) {
                    this.username = username;
                    const currentUserId = this.userService.getCurrentUserId();
                    this.isCreator = this.slide.creator === currentUserId;
                }
            });
        }
        this.setAverageRating();
    }

    onCardSelect() {
        this.notifySelected.emit(this.slide.name);
        this.dialogRef2 = this.dialog.open(CreateJoinGameDialogComponent, {
            // disableClose: true,
            width: '80%',
            data: { gameName: this.slide.name, gameMode: GameMode.classicMode },
            height: '80%',
            panelClass: 'custom-modal',
        });
    }

    deleteCard() {
        this.deleteNotify.emit(this.slide.name);
    }

    resetCard() {
        this.resetNotify.emit(this.slide.name);
    }

    renameCard(): void {
        const dialogRef = this.dialog.open(RenameDialogComponent, { width: '35vw', height: '30vh', panelClass: 'custom-modal' });

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result) {
                this.communicationService.getGame(result).subscribe((res) => {
                    if (!res || Object.keys(res).length === 0) {
                        this.renameNotify.emit({ oldName: this.slide.name, newName: result });
                        this.slide.name = result;
                    } else {
                        this.dialog.open(MessageDialogComponent, {
                            panelClass: 'custom-modal',
                            data: { message: 'Nom de jeu déjà utilisé' },
                        });
                    }
                });
            }
        });
    }

    ngOnDestroy() {
        if (this.dialogRef) {
            this.dialogRef.close();
        }
        if (this.dialogRef2) {
            this.dialogRef2.close();
        }
    }

    joinGame() {
        this.notify.emit(this.slide);
        this.dialogRef = this.dialog.open(WaitingRoomComponent, { disableClose: true, width: '80%', height: '80%', panelClass: 'custom-modal' });
    }

    getStarArray(count: number): any[] {
        return Array.from({ length: count });
    }

    calculateStars(averageR: number) {
        const fullStars = Math.floor(averageR);
        const halfStar = averageR - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        const starsR: string[] = [];
        for (let i = 0; i < fullStars; i++) {
            starsR.push('full');
        }
        if (halfStar) {
            starsR.push('half');
        }
        for (let i = 0; i < emptyStars; i++) {
            starsR.push('empty');
        }
        this.stars = starsR;
    }

    private setRoutes() {
        const { routeOne, btnOne } = options[this.page];
        this.routeOne = routeOne;
        this.btnOne = btnOne;
    }

    private setAverageRating() {
        this.userHttpService.getAverageRating(this.slide.name).subscribe((gameRating: GameRating) => {
            this.averageReviews = gameRating.rating;
            this.numberOfReviews = gameRating.numberOfRating;
            this.calculateStars(this.averageReviews);
        });
    }

    private setBestTimes() {
        this.soloBestTime = [];
        this.vsBestTime = [];
        this.slide.soloBestTimes.forEach((time) => {
            this.soloBestTime.push({
                name: time.name,
                time: `${Math.floor(time.time / Time.Sixty)}:${(time.time % Time.Sixty).toLocaleString('en-US', {
                    minimumIntegerDigits: 2,
                    useGrouping: false,
                })}`,
            });
        });
        this.slide.vsBestTimes.forEach((time) => {
            this.vsBestTime.push({
                name: time.name,
                time: `${Math.floor(time.time / Time.Sixty)}:${(time.time % Time.Sixty).toLocaleString('en-US', {
                    minimumIntegerDigits: 2,
                    useGrouping: false,
                })}`,
            });
        });
    }
}
