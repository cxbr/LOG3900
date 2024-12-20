/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { Vec2 } from '@app/interfaces/vec2';
import { ConfettiService } from '@app/services/confetti/confetti.service';
import { VideoReplayService } from '@app/services/video-replay/video-replay.service';
import { Color } from '@common/enums/color';
import { PossibleColor } from 'src/assets/variables/images-values';
import { ErrorText } from 'src/assets/variables/text';
import { Time } from 'src/assets/variables/time';

@Injectable({
    providedIn: 'root',
})
export class PlayAreaService {
    recordStateTimer?: ReturnType<typeof setInterval>;
    isCheatModeOn = false;
    isHintModeOn = false;
    hintInterval: ReturnType<typeof setInterval>;
    hintTimeout: ReturnType<typeof setTimeout>;
    component: PlayAreaComponent;
    speed = 1;

    private cheatInterval: ReturnType<typeof setInterval>;
    private layerTimeout: ReturnType<typeof setTimeout>;
    private differenceInterval: ReturnType<typeof setInterval>;
    private errorTimeout: ReturnType<typeof setTimeout>;

    private normalComponent: PlayAreaComponent;
    private replayCheatOn: boolean;

    constructor(private confettiService: ConfettiService, private videoReplayService: VideoReplayService) {}

    setComponent(component: PlayAreaComponent) {
        this.component = component;
        this.normalComponent = component;
        this.confettiService.setService(this);
    }

    setCheatMode() {
        this.isCheatModeOn = false;
    }

    setSpeed(speed: number) {
        this.speed = speed;
    }

    clearAsync() {
        clearInterval(this.confettiService.intervalId);
        clearInterval(this.confettiService.confettiInterval);
        clearInterval(this.cheatInterval);
        clearTimeout(this.layerTimeout);
        clearInterval(this.differenceInterval);
        clearTimeout(this.errorTimeout);
        clearInterval(this.hintInterval);
        clearTimeout(this.hintTimeout);
        clearInterval(this.recordStateTimer);
        this.recordStateTimer = undefined;
    }

    startConfetti(coords: Vec2 | undefined) {
        this.confettiService.startConfetti(coords);
    }

    cheatMode() {
        if (!this.component.context1 || !this.component.context2) {
            return;
        }
        if (!this.isCheatModeOn) {
            this.normalComponent.sendCheatEnd.emit();
            this.endCheatMode();
            return;
        }
        this.startCheatMode();
    }

    playObserverHint(imageData: string, left: boolean) {
        const helpAlphaValue = 0.5;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const layer = document.createElement('canvas');
            layer.width = this.component.width;
            layer.height = this.component.height;
            const context = layer.getContext('2d');
            (context as CanvasRenderingContext2D).globalAlpha = helpAlphaValue;
            context?.drawImage(img, 0, 0);
            this.normalComponent.hintLayer = layer;
            this.playNormalHint(this.normalComponent.hintLayer, left);
        };
        img.src = imageData;
    }

    startCheatMode() {
        this.normalComponent.verifyDifferenceMatrix('cheat');
        this.normalComponent.sendCheatStart.emit({ layer: this.component.cheatLayer });

        const flashDuration = Time.OneHundredTwentyFive / this.speed;
        let isFlashing = true;
        this.cheatInterval = setInterval(() => {
            if (isFlashing) {
                this.updateContexts();
            } else {
                this.component.context1.drawImage(this.component.cheatLayer, 0, 0, this.component.width, this.component.height);
                this.component.context2.drawImage(this.component.cheatLayer, 0, 0, this.component.width, this.component.height);
            }
            isFlashing = !isFlashing;
        }, flashDuration);

        this.videoReplayService.recordEvent({
            action: 'startCheatMode',
            imageData1: this.component.original.src,
            imageData2: this.component.modified.src,
            cheatData: this.component.cheatLayer.toDataURL(),
            timestamp: Date.now(),
        });
    }

    endCheatMode() {
        clearInterval(this.cheatInterval);
        this.updateContexts();

        this.videoReplayService.recordEvent({
            action: 'endCheatMode',
            imageData1: this.component.original.src,
            imageData2: this.component.modified.src,
            timestamp: Date.now(),
        });
    }

    setContexts() {
        const context1 = this.component.canvas1.nativeElement.getContext('2d');
        if (context1) {
            this.component.context1 = context1;
            this.component.context1.font = '40px comic sans ms';
        }
        const context2 = this.component.canvas2.nativeElement.getContext('2d');
        if (context2) {
            this.component.context2 = context2;
            this.component.context2.font = '40px comic sans ms';
        }
    }

    flashDifference(difference: number[][], username: string) {
        if (!this.component.context1 || !this.component.context2) return;
        const layer = this.createAndFillNewLayer(Color.Luigi, false, false, difference);
        let isFlashing = false;
        clearInterval(this.differenceInterval);
        this.differenceInterval = setInterval(() => {
            if (isFlashing) {
                this.updateContexts();
            } else {
                this.component.context1.drawImage(layer, 0, 0, this.component.width, this.component.height);
                this.component.context2.drawImage(layer, 0, 0, this.component.width, this.component.height);
            }
            isFlashing = !isFlashing;
        }, Time.Fifty / this.speed);
        this.layerTimeout = setTimeout(() => {
            this.removeDifference(difference);
            this.component.sendMatrixToServer(username);
            this.normalComponent.playerIsAllowedToClick = true;
            clearInterval(this.differenceInterval);
            this.updateContexts();
            this.normalComponent.loadNextGame();
        }, Time.Thousand / 2 / this.speed);

        this.videoReplayService.recordEvent({
            action: 'diffFound',
            imageData1: layer.toDataURL(),
            imageData2: layer.toDataURL(),
            timestamp: Date.now(),
        });
    }

    correctAnswerVisuals(differenceMatrix: number[][], username: string) {
        if (differenceMatrix) {
            this.flashDifference(differenceMatrix, username);
        }
    }

    errorAnswerVisuals(canvas: HTMLCanvasElement, pos: Vec2) {
        const nMilliseconds = Time.Thousand / this.speed;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = Color.Mario;
            clearTimeout(this.errorTimeout);
            this.updateContexts();
            context.fillText('ERREUR', pos.x - ErrorText.Width / 2, pos.y + ErrorText.Height / 2, ErrorText.Width);

            this.videoReplayService.recordEvent({
                action: 'error',
                imageData1: this.component.canvas1.nativeElement.toDataURL(),
                imageData2: this.component.canvas2.nativeElement.toDataURL(),
                timestamp: Date.now(),
            });

            this.errorTimeout = setTimeout(() => {
                this.updateContexts();
                this.normalComponent.playerIsAllowedToClick = true;
            }, nMilliseconds);
        }
    }

    drawImages(differenceMatrix: number[][]) {
        const image1 = this.getImageData(this.component.original);
        const image2 = this.getImageData(this.component.modified);
        if (!image1 || !image2) {
            this.handleImageLoad(this.component.context1, this.component.original);
            this.handleImageLoad(this.component.context2, this.component.modified);
            return;
        }
        const pixelDataSize = 4;
        for (let i = 0; i < differenceMatrix.length; i++) {
            for (let j = 0; j < differenceMatrix[0].length; j++) {
                const index = (i * differenceMatrix[0].length + j) * pixelDataSize;
                if (differenceMatrix[i][j] === PossibleColor.EMPTYPIXEL) {
                    image1.data[index] = image2.data[index];
                    image1.data[index + 1] = image2.data[index + 1];
                    image1.data[index + 2] = image2.data[index + 2];
                    image1.data[index + 3] = image2.data[index + 3];
                }
            }
        }
        this.component.context1.clearRect(0, 0, this.component.width, this.component.height);
        this.component.context1.putImageData(image1, 0, 0);
        this.component.context2.clearRect(0, 0, this.component.width, this.component.height);
        this.component.context2.putImageData(image2, 0, 0);
        this.component.original.src = this.component.canvas1.nativeElement.toDataURL();
        this.component.modified.src = this.component.canvas2.nativeElement.toDataURL();
    }

    getImageData(image: HTMLImageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = this.component.width;
        canvas.height = this.component.height;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(image, 0, 0, this.component.width, this.component.height);
        }
        return context?.getImageData(0, 0, this.component.width, this.component.height);
    }

    // eslint-disable-next-line max-params
    createAndFillNewLayer(color: Color, isCheat: boolean, isHint: boolean, matrix: number[][]): HTMLCanvasElement {
        const helpAlphaValue = 0.5;
        const layer = document.createElement('canvas');
        layer.width = this.component.width;
        layer.height = this.component.height;
        const context = layer.getContext('2d');
        (context as CanvasRenderingContext2D).globalAlpha = isCheat || isHint ? helpAlphaValue : 1;
        (context as CanvasRenderingContext2D).fillStyle = color;
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                if (matrix[i][j] !== PossibleColor.EMPTYPIXEL) {
                    (context as CanvasRenderingContext2D).fillRect(j, i, 1, 1);
                }
            }
        }
        return layer;
    }

    handleImageLoad(context: CanvasRenderingContext2D, image: HTMLImageElement) {
        if (context) {
            context.clearRect(0, 0, this.component.width, this.component.height);
            context.drawImage(image, 0, 0, this.component.width, this.component.height);
        }
    }

    updateCheatSpeed() {
        if (this.replayCheatOn) {
            this.endCheatMode();
            this.startCheatMode();
        }
    }

    playNormalHint(layer: HTMLCanvasElement, left: boolean) {
        let isFlashing = true;
        clearTimeout(this.hintTimeout);
        clearInterval(this.hintInterval);
        this.hintInterval = setInterval(() => {
            if (isFlashing) {
                this.updateContexts();
            } else if (left) {
                this.component.context1.drawImage(layer, 0, 0, this.component.width, this.component.height);
            } else {
                this.component.context2.drawImage(layer, 0, 0, this.component.width, this.component.height);
            }
            isFlashing = !isFlashing;
        }, Time.OneHundredTwentyFive);
        this.hintTimeout = setTimeout(() => {
            clearInterval(this.hintInterval);
            this.updateContexts();
        }, (2 * Time.Thousand) / this.speed);
        if (left) {
            this.videoReplayService.recordEvent({
                action: 'hint',
                imageData1: layer.toDataURL(),
                imageData2: this.component.canvas2.nativeElement.toDataURL(),
                timestamp: Date.now(),
            });
        } else {
            this.videoReplayService.recordEvent({
                action: 'hint',
                imageData1: this.component.canvas1.nativeElement.toDataURL(),
                imageData2: layer.toDataURL(),
                timestamp: Date.now(),
            });
        }
    }

    saveGameState() {
        this.videoReplayService.recordState({
            gameRoom: JSON.parse(JSON.stringify(this.component.gameRoom)),
            imageData1: this.component.canvas1.nativeElement.toDataURL(),
            imageData2: this.component.canvas2.nativeElement.toDataURL(),
        });
        this.recordStateTimer = setInterval(() => {
            this.videoReplayService.recordState({
                gameRoom: JSON.parse(JSON.stringify(this.component.gameRoom)),
                imageData1: this.component.canvas1.nativeElement.toDataURL(),
                imageData2: this.component.canvas2.nativeElement.toDataURL(),
            });
        }, Time.Thousand);
    }

    clearReplayInterval() {
        clearInterval(this.recordStateTimer);
        this.recordStateTimer = undefined;
        this.videoReplayService.recordState({
            gameRoom: JSON.parse(JSON.stringify(this.component.gameRoom)),
            imageData1: this.component.canvas1.nativeElement.toDataURL(),
            imageData2: this.component.canvas2.nativeElement.toDataURL(),
        });
    }

    private removeDifference(differenceMatrix: number[][]) {
        const differencePositions: Vec2[] = [];
        this.updateContexts();
        const image1 = this.component.context1.getImageData(0, 0, this.component.width, this.component.height);
        const image2 = this.component.context2.getImageData(0, 0, this.component.width, this.component.height);

        for (let i = 0; i < differenceMatrix.length; i++) {
            for (let j = 0; j < differenceMatrix[0].length; j++) {
                if (differenceMatrix[i][j] !== PossibleColor.EMPTYPIXEL) {
                    differencePositions.push({ x: j, y: i });
                    this.normalComponent.differenceMatrix[i][j] = PossibleColor.EMPTYPIXEL;
                }
            }
        }
        const pixelDataSize = 4;
        for (const i of differencePositions) {
            const x = i.x;
            const y = i.y;
            const index = (y * this.component.width + x) * pixelDataSize;
            image2.data[index] = image1.data[index];
            image2.data[index + 1] = image1.data[index + 1];
            image2.data[index + 2] = image1.data[index + 2];
            image2.data[index + 3] = image1.data[index + 3];
        }
        this.component.context2.clearRect(0, 0, this.component.width, this.component.height);
        this.component.context2.putImageData(image2, 0, 0);
        this.component.modified.src = this.component.canvas2.nativeElement.toDataURL();
        this.normalComponent.verifyDifferenceMatrix('cheat');
        if (!this.component.cheatLayer) return;
        this.videoReplayService.recordEvent({
            action: 'cheatModeModified',
            imageData1: this.component.context1.canvas.toDataURL(),
            imageData2: this.component.modified.src,
            cheatData: this.component.cheatLayer.toDataURL(),
            timestamp: Date.now(),
        });
        this.videoReplayService.recordEvent({
            action: 'diffFoundEnd',
            imageData1: this.component.context1.canvas.toDataURL(),
            imageData2: this.component.modified.src,
            timestamp: Date.now(),
        });
    }

    private updateContexts() {
        if (this.component) {
            this.component.context1.drawImage(this.component.original, 0, 0, this.component.width, this.component.height);
            this.component.context2.drawImage(this.component.modified, 0, 0, this.component.width, this.component.height);
        }
    }
}
