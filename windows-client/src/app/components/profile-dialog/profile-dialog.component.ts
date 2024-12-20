import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FriendService } from '@app/services/friend/friend.service';
import { UserService } from '@app/services/user/user.service';
import { UserProfile } from '@common/classes/user-profile';

@Component({
    selector: 'app-profile-dialog',
    templateUrl: './profile-dialog.component.html',
    styleUrls: ['./profile-dialog.component.scss'],
})
export class ProfileDialogComponent {
    users: UserProfile[];
    friends: UserProfile[] = [];
    user: UserProfile;
    isFriend: boolean = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { users: UserProfile[]; user: UserProfile },
        private readonly friendService: FriendService,
        private readonly userService: UserService,
    ) {
        this.users = data.users;
        this.refreshDialog(data.user);
    }

    refreshDialog(user: UserProfile): void {
        this.user = user;
        // eslint-disable-next-line no-underscore-dangle
        this.userService.getFriendList(this.user._id).subscribe((friendList: string[]) => {
            this.isFriend = friendList.includes(this.userService.loggedInUser?._id as string);

            this.users.sort((userA, userB) => {
                return userA.username.toLowerCase().localeCompare(userB.username.toLowerCase());
            });
            const friends: UserProfile[] = this.users.filter((userInfo) => {
                // eslint-disable-next-line no-underscore-dangle
                return friendList.includes(userInfo._id);
            });
            this.friends = friends === undefined ? [] : friends;
        });
    }

    sendFriendRequest(userId: string) {
        this.friendService.sendFriendRequest(userId);
    }

    acceptFriendRequest(userId: string) {
        this.friendService.acceptFriendRequest(userId);
    }

    declineFriendRequest(userId: string) {
        this.friendService.declineFriendRequest(userId);
    }

    removeFriend(userId: string) {
        this.friendService.removeFriend(userId);
    }
}
