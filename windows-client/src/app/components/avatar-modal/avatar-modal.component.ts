import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CameraService } from '@app/services/camera/camera.service';
import { UserHttpService } from '@app/services/user-http/user-http.service';

@Component({
    selector: 'app-avatar-modal',
    templateUrl: './avatar-modal.component.html',
    styleUrls: ['./avatar-modal.component.scss'],
})
export class AvatarModalComponent implements OnInit {
    avatar: string;
    predefinedAvatarPaths: string[] = [];
    imageUrl: string | ArrayBuffer | null = null;
    initialRoute: string;
    sendRightAway: boolean;

    // eslint-disable-next-line max-params
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { [x: string]: string | boolean },
        private dialogRef: MatDialogRef<AvatarModalComponent>,
        private readonly userHttpService: UserHttpService,
        private readonly router: Router,
        private readonly cameraService: CameraService,
    ) {
        this.getAvatarsFromServer();
    }

    ngOnInit(): void {
        this.initialRoute = this.data.initialRoute as string;
        this.sendRightAway = this.data.sendRightAway as boolean;
    }

    getAvatarsFromServer(): void {
        this.userHttpService.getPredefinedAvatars().subscribe((avatarPaths) => {
            this.predefinedAvatarPaths = avatarPaths;
        });
    }

    setAvatar(avatar: string, isLocal: boolean = false): void {
        this.dialogRef.close({ avatarData: avatar, isLocalImage: isLocal });
    }

    onFileUpload(event: Event) {
        const inputElement: HTMLInputElement = event.target as HTMLInputElement;
        const uploadedFile: File = (inputElement.files as FileList)[0];
        const reader: FileReader = new FileReader();
        reader.onload = () => {
            this.imageUrl = reader.result as string;
            this.setAvatar(this.imageUrl as string, true);
        };
        reader.readAsDataURL(uploadedFile);
    }

    async openCamera(): Promise<void> {
        try {
            const mediaStream = await this.cameraService.accessCamera();
            if (mediaStream) {
                this.closeModal();
                this.router.navigate(['/capture'], { state: { initialRoute: this.initialRoute, sendRightAway: this.sendRightAway } });
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error accessing camera:', error);
        }
    }

    closeModal() {
        this.dialogRef.close();
    }
}
