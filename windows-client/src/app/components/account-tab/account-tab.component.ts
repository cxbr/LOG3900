import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UpdateUsernameColorDialogComponent } from '@app/components/update-username-color-dialog/update-username-color-dialog.component';
import { UpdateUsernameDialogComponent } from '@app/components/update-username-dialog/update-username-dialog.component';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { ThemeService } from '@app/services/theme/theme.service';
import { UserService } from '@app/services/user/user.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { UserProfileUI } from '@common/classes/user-profile-ui';
import { UserEvents } from '@common/enums/user.gateway.variables';

@Component({
    selector: 'app-account-tab',
    templateUrl: './account-tab.component.html',
    styleUrls: ['./account-tab.component.scss'],
})
export class AccountTabComponent implements OnInit {
    @Input() usernameDialogRef: MatDialogRef<UpdateUsernameDialogComponent>;
    @Input() colorDialogRef: MatDialogRef<UpdateUsernameColorDialogComponent>;
    username: string;
    modifiedUsername: string;
    isUpdateUsernameButtonDisabled: boolean = true;
    isUpdateColorButtonDisabled: boolean = true;
    isToggled: boolean;
    usernameColor: string = '#000000'; // default color
    pickerColor: string;
    modifiedColor: string;

    // eslint-disable-next-line max-params
    constructor(
        public userService: UserService,
        private readonly verifyInputService: VerifyInputService,
        private dialog: MatDialog,
        private readonly themeService: ThemeService,
        private socketService: CommunicationSocketService,
    ) {
        this.isToggled = themeService.getIsDarkMode();
    }

    ngOnInit(): void {
        this.setUsername();
        this.getOwnUsernameColor();
    }

    toggleDarkTheme(): void {
        this.isToggled = !this.isToggled;
        this.themeService.setIsDarkMode(this.isToggled);
    }

    setUsername(): void {
        this.username = this.userService.getToken() as string;
    }

    updateModifiedUsername(newUsername: string): void {
        this.modifiedUsername = newUsername;
        this.isUpdateUsernameButtonDisabled = this.modifiedUsername === this.username;
    }

    updateUsername(): void {
        if (!this.verifyInputService.verify(this.modifiedUsername)) {
            this.usernameDialogRef = this.dialog.open(UpdateUsernameDialogComponent, {
                data: { isInvalidUsername: true, isUsernameTaken: false, isUsernameUpdated: false },
                panelClass: 'custom-modal',
            });
            return;
        }
        this.userService.updateUsername(this.modifiedUsername).subscribe({
            next: () => {
                this.setUsername();
                this.updateModifiedUsername(this.username);
                this.usernameDialogRef = this.dialog.open(UpdateUsernameDialogComponent, {
                    data: { isInvalidUsername: false, isUsernameTaken: false, isUsernameUpdated: true },
                    panelClass: 'custom-modal',
                });
            },
            error: () => {
                this.usernameDialogRef = this.dialog.open(UpdateUsernameDialogComponent, {
                    data: { isInvalidUsername: false, isUsernameTaken: true, isUsernameUpdated: false },
                    panelClass: 'custom-modal',
                });
            },
        });
    }

    updateModifiedColor(newColor: string): void {
        this.isUpdateColorButtonDisabled = newColor === this.pickerColor;
    }

    updateUsernameColor(newColor: string): void {
        const updateUsernameColorDto = { userId: this.userService.loggedInUser?._id, usernameColor: newColor };
        this.socketService.send(UserEvents.UsernameColorUpdated, updateUsernameColorDto);

        this.socketService.on('error', () => {
            this.colorDialogRef = this.dialog.open(UpdateUsernameColorDialogComponent, {
                data: { isColorUpdated: false },
                panelClass: 'custom-modal',
            });
        });

        this.socketService.on('connect_error', () => {
            this.colorDialogRef = this.dialog.open(UpdateUsernameColorDialogComponent, {
                data: { isColorUpdated: false },
                panelClass: 'custom-modal',
            });
        });

        this.colorDialogRef = this.dialog.open(UpdateUsernameColorDialogComponent, {
            data: { isColorUpdated: true },
            panelClass: 'custom-modal',
        });
        this.usernameColor = newColor;
        this.pickerColor = newColor;
        const cachedProfileUI = this.userService.usernameColorCache.get(this.username) as UserProfileUI;
        if (cachedProfileUI) {
            cachedProfileUI.usernameColor = newColor;
        }
        this.userService.usernameColorCache.set(this.username, cachedProfileUI);
        this.updateModifiedColor(newColor);
    }

    private getOwnUsernameColor(): void {
        const userId = this.userService.loggedInUser?._id || '';
        this.userService.getUsernameUI(userId, this.username).subscribe({
            next: (userProfileUI: UserProfileUI) => {
                if (userProfileUI) {
                    this.usernameColor = userProfileUI.usernameColor;
                    this.pickerColor = userProfileUI.usernameColor;
                }
            },
        });
    }
}
