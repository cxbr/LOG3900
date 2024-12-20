import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
    selector: 'app-management-modal-dialog',
    templateUrl: './management-dialog.component.html',
    styleUrls: ['./management-dialog.component.scss'],
})
export class ManagementDialogComponent {
    form: FormGroup;
    passwordError: boolean = false;

    constructor(public dialogRef: MatDialogRef<ManagementDialogComponent>, private fb: FormBuilder) {
        this.form = this.fb.group({
            password: ['', Validators.required],
        });
    }

    onEnterKeyPressed(): void {
        this.form.get('password')?.markAsTouched();

        if (this.form.valid) {
            this.checkPassword();
        }
    }

    checkPassword(): void {
        const passwordControl = this.form.get('password');
        if (passwordControl?.value !== 'mismatch') {
            passwordControl?.setErrors({ wrongPassword: true });
        } else {
            this.dialogRef.close(passwordControl);
        }
    }
}
