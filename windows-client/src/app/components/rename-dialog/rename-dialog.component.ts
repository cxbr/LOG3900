import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
@Component({
    selector: 'app-rename-modal-dialog',
    templateUrl: './rename-dialog.component.html',
    styleUrls: ['./rename-dialog.component.scss'],
})
export class RenameDialogComponent {
    newName: string = '';
    form: FormGroup;
    applyBorder = false;

    constructor(private verifyInputService: VerifyInputService, public dialogRef: MatDialogRef<RenameDialogComponent>, private fb: FormBuilder) {
        this.form = this.fb.group({
            newName: ['', Validators.required],
        });
    }

    onEnter(): void {
        if (this.form.valid) {
            if (!this.verifyInputService.verify(this.newName)) {
                this.applyBorder = true;
            } else {
                this.dialogRef.close(this.newName);
            }
        }
    }
}
