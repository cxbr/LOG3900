import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-update-password-dialog',
    templateUrl: './update-password-dialog.component.html',
    styleUrls: ['./update-password-dialog.component.scss'],
})
export class UpdatePasswordDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<UpdatePasswordDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { isEmailSent: boolean; isPasswordUpdated: boolean },
    ) {}

    closeDialog(): void {
        this.dialogRef.close();
    }
}
