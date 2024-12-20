import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogComponent } from '@app/components/profile-dialog/profile-dialog.component';
import { FriendService } from '@app/services/friend/friend.service';
import { UserProfile } from '@common/classes/user-profile';

@Component({
    selector: 'app-profile-list',
    templateUrl: './profile-list.component.html',
    styleUrls: ['./profile-list.component.scss'],
})
export class ProfileListComponent {
    @Input() users: UserProfile[];
    @Input() filteredUsers: UserProfile[];

    constructor(private dialog: MatDialog, private readonly friendService: FriendService) {}

    openProfileDialog(selectedUser: UserProfile): void {
        this.dialog.open(ProfileDialogComponent, {
            panelClass: 'custom-modal',
            data: { users: this.users, user: selectedUser },
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
