import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AvatarModalComponent } from '@app/components/avatar-modal/avatar-modal.component';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { AvatarService } from '@app/services/avatar/avatar.service';
import { UserService } from '@app/services/user/user.service';
import { DeleteDialogAction } from 'src/assets/variables/delete-dialog-action';

@Component({
    selector: 'app-avatar',
    templateUrl: './avatar.component.html',
    styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent implements AfterViewInit {
    @ViewChild('image') image: ElementRef<HTMLImageElement>;
    @ViewChild('avatarContainer') avatarContainer: ElementRef<HTMLDivElement>;

    @Input() isEditable: boolean = false;
    @Input() initialRoute: string;
    @Input() sendRightAway: boolean = false;
    avatar: string;
    isMatError: boolean = false;

    private avatarDialogRef: MatDialogRef<AvatarModalComponent>;
    private confirmationDialogRef: MatDialogRef<DeleteDialogComponent>;
    constructor(private dialog: MatDialog, private readonly avatarService: AvatarService, private readonly userService: UserService) {
        this.avatar = this.avatarService.getAvatar();
    }

    ngAfterViewInit(): void {
        this.setAvatarDimensions();
    }

    openAvatarModal() {
        this.avatarDialogRef = this.dialog.open(AvatarModalComponent, {
            panelClass: 'custom-modal',
            data: { initialRoute: this.initialRoute, sendRightAway: this.sendRightAway },
        });

        this.avatarDialogRef.afterClosed().subscribe((data) => {
            if (!this.sendRightAway) {
                this.setAvatarOnSignup(data);
            } else if (data != null) {
                this.sendAvatarToServer(data);
            }
        });
    }

    toggleMatError(): void {
        this.isMatError = this.avatar === '';
    }

    private setAvatarDimensions(): void {
        this.image.nativeElement.onload = () => {
            if (this.image.nativeElement.width <= this.image.nativeElement.height) {
                this.image.nativeElement.classList.add('full-width');
                this.image.nativeElement.classList.remove('full-height');
            } else if (this.image.nativeElement.width > this.image.nativeElement.height) {
                this.image.nativeElement.classList.add('full-height');
                this.image.nativeElement.classList.remove('full-width');
            }
        };
    }

    private sendAvatarToServer(data: { [x: string]: string }) {
        this.confirmationDialogRef = this.dialog.open(DeleteDialogComponent, {
            data: { action: DeleteDialogAction.ChangeAvatar },
            panelClass: 'custom-modal',
        });

        this.confirmationDialogRef.afterClosed().subscribe(async (isAnswerTrue) => {
            if (isAnswerTrue) {
                await this.userService.setAvatar(data);
                this.avatar = this.avatarService.getAvatar();
                this.setAvatarDimensions();
            }
        });
    }

    private setAvatarOnSignup(data: { [x: string]: string } | null): void {
        if (data != null && data.avatarData != null) {
            this.avatar = data.avatarData;
            if (data.isLocalImage) {
                this.avatarService.setLocalAvatar(data.avatarData);
            } else {
                this.avatarService.setNetworkAvatar(data.avatarData);
            }
            this.setAvatarDimensions();
        }
        this.toggleMatError();
    }
}
