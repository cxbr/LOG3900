import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FriendDialogComponent } from '@app/components/friend-dialog/friend-dialog.component';
import { FriendService } from '@app/services/friend/friend.service';
import { UserService } from '@app/services/user/user.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-friend-button',
    templateUrl: './friend-button.component.html',
    styleUrls: ['./friend-button.component.scss'],
})
export class FriendButtonComponent implements OnDestroy {
    notifCount: number;
    private seenSubscription: Subscription;
    private seenOneSubscription: Subscription;
    private requestSubscription: Subscription;

    constructor(readonly userService: UserService, private readonly friendService: FriendService, private dialog: MatDialog) {
        // eslint-disable-next-line no-underscore-dangle
        userService.getFriendNotificationCount(userService.loggedInUser?._id as string).subscribe((value) => {
            this.notifCount = value;
        });
        this.friendService.registerSocketEvents();
        this.subscribeToSockets();
    }

    ngOnDestroy(): void {
        this.unsubscribeFromSockets();
        this.friendService.deregisterSocketEvents();
    }

    openFriendDialog() {
        this.dialog.open(FriendDialogComponent, { panelClass: 'custom-modal' });
    }

    getIconClass() {
        return this.notifCount > 0 ? 'alert-notification' : '';
    }

    private subscribeToSockets() {
        this.seenSubscription = this.friendService.requestsSeen$.subscribe(() => {
            if (this.notifCount > 0) {
                this.notifCount = 0;
            }
        });

        this.seenOneSubscription = this.friendService.requestSeenOne$.subscribe(() => {
            this.notifCount--;
        });

        this.requestSubscription = this.friendService.requestReceived$.subscribe(() => {
            this.notifCount++;
            const audio = new Audio('assets/sounds/friend_notification.wav');
            audio.play();
        });
    }

    private unsubscribeFromSockets() {
        this.seenSubscription.unsubscribe();
        this.seenOneSubscription.unsubscribe();
        this.requestSubscription.unsubscribe();
    }
}
