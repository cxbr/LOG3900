import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatButtonComponent } from '@app/components/chat-button/chat-button.component';
import { CreateJoinGameDialogComponent } from '@app/components/create-join-game-dialog/create-join-game-dialog.component';
import { FriendDialogComponent } from '@app/components/friend-dialog/friend-dialog.component';
import { ManagementDialogComponent } from '@app/components/management-dialog/management-dialog.component';
import { FriendService } from '@app/services/friend/friend.service';
import { GameService } from '@app/services/game/game.service';
import { UserService } from '@app/services/user/user.service';
import { GameMode } from '@common/game-mode';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class MainPageComponent implements OnDestroy {
    dialogRef: MatDialogRef<CreateJoinGameDialogComponent | FriendDialogComponent>;

    // eslint-disable-next-line max-params
    constructor(
        private readonly router: Router,
        private dialog: MatDialog,
        private userService: UserService,
        private gameService: GameService,
        private readonly friendService: FriendService,
    ) {
        friendService.registerFriendSocket();
        this.gameService.getAllGames();
    }

    setGameMode(mode: string) {
        if (mode === GameMode.classicMode) {
            this.router.navigate(['/selection']);
        } else {
            this.dialogRef = this.dialog.open(CreateJoinGameDialogComponent, {
                disableClose: false,
                width: '80%',
                data: { gameName: undefined, gameMode: GameMode.limitedTimeMode },
                height: '80%',
                panelClass: 'custom-modal',
            });
        }
    }

    logout(): void {
        this.friendService.deregisterFriendSocket();
        ChatButtonComponent.forceCloseOpenChatModal();
        this.userService.logout();
    }

    openGameManagement(): void {
        const dialogRef = this.dialog.open(ManagementDialogComponent, { width: '35vw', height: '30vh', panelClass: 'custom-modal' });

        dialogRef.afterClosed().subscribe((password) => {
            if (password) {
                this.router.navigate(['/game-management']);
            }
        });
    }

    ngOnDestroy() {
        if (this.dialogRef) {
            this.dialogRef.close();
        }
    }
}
