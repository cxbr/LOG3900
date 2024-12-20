import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { FriendService } from '@app/services/friend/friend.service';
import { UserService } from '@app/services/user/user.service';
import { UserProfile } from '@common/classes/user-profile';
import { UserState } from '@common/enums/user-state';

import { Subscription, catchError, of } from 'rxjs';

@Component({
    selector: 'app-friend-dialog',
    templateUrl: './friend-dialog.component.html',
    styleUrls: ['./friend-dialog.component.scss'],
})
export class FriendDialogComponent implements OnDestroy {
    users: UserProfile[];
    filter: string = '';

    unseenRequestUsers: UserProfile[] = [];
    seenRequestUsers: UserProfile[] = [];
    sentRequestUsers: UserProfile[] = [];
    friends: UserProfile[] = [];
    strangers: UserProfile[] = [];

    private receiveSubscription: Subscription;
    private sentSubscription: Subscription;
    private acceptSubscription: Subscription;
    private declineSubscription: Subscription;
    private removeSubscription: Subscription;
    private addSubscription: Subscription;

    constructor(private readonly friendService: FriendService, private readonly userService: UserService, private dialog: MatDialog) {
        this.userService
            .getUserList()
            .pipe(
                catchError((error) => {
                    this.openErrorDialog(error);
                    return of([]);
                }),
            )
            .subscribe((data) => {
                this.users = data;
                this.filterUsers();
                this.subscribeToSockets();
            });
    }

    ngOnDestroy(): void {
        this.friendService.seenFriendRequests();
        this.unsubscribeFromSockets();
    }

    getUsersByState(userState: string, users: UserProfile[]): UserProfile[] {
        const filteredUsers: UserProfile[] = users.filter((user: UserProfile) => {
            return user.state === userState;
        });
        return filteredUsers === undefined ? [] : filteredUsers;
    }

    filterUsers(): void {
        this.users.sort((userA, userB) => {
            return userA.username.toLowerCase().localeCompare(userB.username.toLowerCase());
        });
        const filteredUsers: UserProfile[] =
            this.filter === ''
                ? this.users
                : this.users.filter((user: UserProfile) => {
                      return user.username.toLowerCase().startsWith(this.filter.toLowerCase());
                  });
        this.groupUsers(filteredUsers);
    }

    private setUserState(userId: string, state: UserState) {
        this.users.forEach((user) => {
            if (user._id === userId) {
                user.state = state;
            }
        });
        this.filterUsers();
    }

    private groupUsers(filteredUsers: UserProfile[]): void {
        this.unseenRequestUsers = this.getUsersByState(UserState.RequestUnseen, filteredUsers);
        this.seenRequestUsers = this.getUsersByState(UserState.RequestReceived, filteredUsers);
        this.sentRequestUsers = this.getUsersByState(UserState.RequestSent, filteredUsers);
        this.friends = this.getUsersByState(UserState.IsFriend, filteredUsers);
        this.strangers = this.getUsersByState(UserState.IsStranger, filteredUsers);
    }

    private openErrorDialog(errorMessage: string): void {
        this.dialog.open(MessageDialogComponent, {
            panelClass: 'custom-modal',
            data: { message: errorMessage },
        });
    }

    private subscribeToSockets(): void {
        this.sentSubscription = this.friendService.requestSent$.subscribe((userId: string) => {
            this.setUserState(userId, UserState.RequestSent);
        });

        // set state to unseenRequest
        this.receiveSubscription = this.friendService.requestReceived$.subscribe((userId: string) => {
            this.setUserState(userId, UserState.RequestUnseen);
        });

        this.acceptSubscription = this.friendService.requestAccepted$.subscribe((userId: string) => {
            this.setUserState(userId, UserState.IsFriend);
        });

        this.declineSubscription = this.friendService.requestDeclined$.subscribe((userId: string) => {
            this.setUserState(userId, UserState.IsStranger);
        });

        this.removeSubscription = this.friendService.removeFriend$.subscribe((userId: string) => {
            this.setUserState(userId, UserState.IsStranger);
        });

        this.addSubscription = this.friendService.addUser$.subscribe((user: UserProfile) => {
            this.users.push(user);
            this.filterUsers();
        });
    }

    private unsubscribeFromSockets(): void {
        this.sentSubscription.unsubscribe();
        this.receiveSubscription.unsubscribe();
        this.acceptSubscription.unsubscribe();
        this.declineSubscription.unsubscribe();
        this.removeSubscription.unsubscribe();
        this.addSubscription.unsubscribe();
    }
}
