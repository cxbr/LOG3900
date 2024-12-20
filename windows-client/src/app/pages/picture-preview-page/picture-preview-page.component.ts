import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarService } from '@app/services/avatar/avatar.service';
import { UserService } from '@app/services/user/user.service';

@Component({
    selector: 'app-picture-preview-page',
    templateUrl: './picture-preview-page.component.html',
    styleUrls: ['./picture-preview-page.component.scss'],
})
export class PicturePreviewPageComponent {
    @ViewChild('picture_preview') picturePreviewCanvas: ElementRef<HTMLCanvasElement>;

    initialRoute: string;
    capturedImage: string;
    sendRightAway: boolean;

    constructor(private readonly router: Router, private readonly avatarService: AvatarService, private readonly userService: UserService) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation && navigation.extras.state) {
            this.capturedImage = navigation.extras.state.capturedImage;
            this.initialRoute = navigation.extras.state.initialRoute;
            this.sendRightAway = navigation.extras.state.sendRightAway;
        }
    }

    savePictureOnClick(): void {
        this.savePicture().then(() => {
            this.router.navigate([this.initialRoute]);
        });
    }

    reopenCamera(): void {
        this.router.navigate(['/capture'], { state: { initialRoute: this.initialRoute } });
    }

    private async savePicture(): Promise<void> {
        const data = { isLocalImage: 'true', avatarData: this.capturedImage };
        if (this.sendRightAway) {
            await this.userService.setAvatar(data);
        } else {
            this.avatarService.setLocalAvatar(this.capturedImage);
        }
    }
}
