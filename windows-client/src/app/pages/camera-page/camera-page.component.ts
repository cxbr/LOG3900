import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CameraService } from '@app/services/camera/camera.service';

@Component({
    selector: 'app-camera-page',
    templateUrl: './camera-page.component.html',
    styleUrls: ['./camera-page.component.scss'],
})
export class CameraPageComponent implements AfterViewInit, OnDestroy {
    @ViewChild('video') videoElement: ElementRef<HTMLVideoElement>;
    video: HTMLVideoElement;
    stream: MediaStream;
    initialRoute: string;
    sendRightAway: boolean;

    constructor(private readonly router: Router, private readonly cameraService: CameraService) {
        const navigation = this.router.getCurrentNavigation();
        if (navigation && navigation.extras.state) {
            this.initialRoute = navigation.extras.state.initialRoute;
            this.sendRightAway = navigation.extras.state.sendRightAway;
        }
    }

    ngAfterViewInit() {
        this.initCamera();
    }

    ngOnDestroy(): void {
        this.cameraService.stopCamera();
    }

    takePhoto() {
        const canvas = document.createElement('canvas');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;

        const X_SCALE = -1;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.translate(canvas.width, 0);
        context.scale(X_SCALE, 1);
        context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

        const dataURL = canvas.toDataURL('image/png');

        this.router.navigate(['/cature-preview'], {
            state: { capturedImage: dataURL, initialRoute: this.initialRoute, sendRightAway: this.sendRightAway },
        });
    }

    private async initCamera(): Promise<void> {
        try {
            this.stream = await this.cameraService.accessCamera();
            this.video = this.videoElement.nativeElement;
            this.video.srcObject = this.stream;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error accessing camera:', error);
        }
    }
}
