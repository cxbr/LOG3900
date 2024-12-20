import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '@app/services/user/user.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { Dimensions } from 'src/assets/variables/picture-dimension';
@Component({
    selector: 'app-creation-modal-dialog',
    templateUrl: './creation-dialog.component.html',
    styleUrls: ['./creation-dialog.component.scss'],
})
export class CreationDialogComponent implements AfterViewInit {
    @ViewChild('canvasDifferences') canvasDifferences: ElementRef<HTMLCanvasElement>;
    width = Dimensions.DefaultWidth;
    height = Dimensions.DefaultHeight;
    inputValue: string;
    wantShoutout = false;
    applyBorder = false;
    validDifferenceCount = false;

    private context: CanvasRenderingContext2D;
    private image: HTMLImageElement;

    // eslint-disable-next-line max-params
    constructor(
        private verifyInputService: VerifyInputService,
        private userService: UserService,
        private dialogRef: MatDialogRef<CreationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string; nbDifferences: number },
    ) {}

    ngAfterViewInit(): void {
        this.context = this.canvasDifferences.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.image = new Image();
        this.image.src = this.data.imageUrl;
        this.image.onload = () => {
            this.drawImage(this.image);
        };
        this.verifyDifferenceCount();
    }

    saveGame() {
        if (!this.verifyInputService.verify(this.inputValue)) {
            this.applyBorder = true;
        } else {
            this.exitDialog(this.inputValue, this.userService.loggedInUser?._id, this.wantShoutout);
            this.applyBorder = false;
        }
    }

    exitDialog(gameTitle: string | undefined, creator: string | undefined, shoutout: boolean | undefined): void {
        if (gameTitle === undefined) {
            this.dialogRef.close();
        } else {
            this.dialogRef.close({ gameTitle, creator, shoutout });
        }
    }

    disableDefaultFocus(event: KeyboardEvent): void {
        event.preventDefault();
    }

    private drawImage(image: HTMLImageElement) {
        this.context.drawImage(image, 0, 0, this.width, this.height);
    }

    private verifyDifferenceCount() {
        const minDifferenceCount = 3;
        const maxDifferenceCount = 9;
        this.validDifferenceCount = this.data.nbDifferences >= minDifferenceCount && this.data.nbDifferences <= maxDifferenceCount;
    }
}
