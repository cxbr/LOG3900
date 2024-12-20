import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-update-username-modal-dialog',
    templateUrl: './update-username-dialog.component.html',
    styleUrls: ['./update-username-dialog.component.scss'],
})
export class UpdateUsernameDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<UpdateUsernameDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { isInvalidUsername: boolean; isUsernameTaken: boolean; isUsernameUpdated: boolean },
    ) {}

    closeDialog(): void {
        this.dialogRef.close();
    }
}
