import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-update-username-color-dialog',
    templateUrl: './update-username-color-dialog.component.html',
    styleUrls: ['./update-username-color-dialog.component.scss'],
})
export class UpdateUsernameColorDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<UpdateUsernameColorDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { isColorUpdated: boolean },
    ) {}

    closeDialog(): void {
        this.dialogRef.close();
    }
}
