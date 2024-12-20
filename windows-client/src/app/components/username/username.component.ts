import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { UserService } from '@app/services/user/user.service';
import { UserEvents } from '@common/enums/user.gateway.variables';

@Component({
    selector: 'app-username',
    templateUrl: './username.component.html',
    styleUrls: ['./username.component.scss'],
})
export class UsernameComponent implements OnInit, OnDestroy {
    @Input() username?: string;
    @Input() userId?: string;
    @Input() isShowAvatar: boolean = true;
    @Output() loadingChange = new EventEmitter<boolean>();
    usernameColor: string;
    userAvatar: string;
    isLoading: boolean = true;

    constructor(private userService: UserService, private socketService: CommunicationSocketService) {}

    ngOnInit(): void {
        if (!this.userId) {
            this.getUserId();
        }
        if (!this.username) {
            this.getUsername();
        }
        this.socketService.on(UserEvents.UsernameColorUpdated, (data: { userId: string; usernameColor: string }) => {
            if (data.userId === this.userId) {
                this.usernameColor = data.usernameColor;
            }
        });
    }

    ngOnDestroy(): void {
        this.socketService.off(UserEvents.UsernameColorUpdated);
    }

    private getUserId(): void {
        if (!this.username) {
            this.userId = '';
            this.usernameColor = 'black';
            this.emitLoadingChange();
            return;
        }
        const cachedProfileUI = this.userService.usernameColorCache.get(this.username);
        if (cachedProfileUI) {
            this.usernameColor = cachedProfileUI.usernameColor;
            this.userAvatar = cachedProfileUI.avatar;
            this.emitLoadingChange();
        }
        this.userService.getUserIdByUsername(this.username).subscribe((id) => {
            this.userId = id;
            this.setUsernameColor();
            this.emitLoadingChange();
        });
    }

    private getUsername(): void {
        if (!this.userId) {
            this.username = '';
            this.usernameColor = 'black';
            this.emitLoadingChange();
            return;
        }
        this.userService.getUsernameByUserId(this.userId).subscribe((username) => {
            this.username = username;
            this.setUsernameColor();
        });
    }

    private setUsernameColor(): void {
        if (!this.userId || !this.username) {
            this.usernameColor = 'black';
            this.userAvatar = '';
            this.emitLoadingChange();
            return;
        }
        this.userService.getUsernameUI(this.userId, this.username).subscribe((userProfileUI) => {
            if (userProfileUI) {
                this.usernameColor = userProfileUI.usernameColor;
                this.userAvatar = userProfileUI.avatar;
            }
            this.emitLoadingChange();
        });
    }

    private emitLoadingChange(): void {
        this.isLoading = false;
        this.loadingChange.emit(false);
    }
}
