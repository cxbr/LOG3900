import { Component, Input } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UpdatePasswordDialogComponent } from '@app/components/update-password-dialog/update-password-dialog.component';
import { ResetPasswordUser } from '@app/interfaces/user';
import { UserService } from '@app/services/user/user.service';

@Component({
    selector: 'app-password-recuperation-page',
    templateUrl: './password-recuperation-page.component.html',
    styleUrls: ['./password-recuperation-page.component.scss'],
})
export class PasswordRecuperationPageComponent {
    @Input() dialogRef: MatDialogRef<UpdatePasswordDialogComponent>;
    resetPasswordUser: ResetPasswordUser = {} as ResetPasswordUser;
    passwordRecuperationForm: FormGroup;
    codeValidationForm: FormGroup;
    passwordResetForm: FormGroup;
    emailStatus$: string;
    isEmailSent: boolean = false;
    isCodeValid: boolean = false;

    // eslint-disable-next-line max-params
    constructor(private userService: UserService, private fb: FormBuilder, private router: Router, private dialog: MatDialog) {
        this.passwordRecuperationForm = this.fb.group({
            email: ['', [Validators.required, this.strictEmailValidator()]],
        });
        this.passwordRecuperationForm.get('email')?.statusChanges.subscribe((status) => {
            this.emailStatus$ = status;
        });

        this.codeValidationForm = this.fb.group({
            code: ['', Validators.required],
        });

        this.passwordResetForm = this.fb.group(
            {
                password: ['', Validators.required],
                passwordConf: ['', Validators.required],
            },
            { validator: this.passwordMatchValidator('password', 'passwordConf') } as AbstractControlOptions,
        );
    }

    verifyEmail() {
        const emailControl = this.passwordRecuperationForm.get('email');

        if (this.passwordRecuperationForm.valid && emailControl?.touched) {
            this.userService.getUserByEmail(this.passwordRecuperationForm.value.email).subscribe({
                next: (response) => {
                    this.resetPasswordUser.userId = response.userId as string;
                    this.resetPasswordUser.username = response.username as string;
                    this.sendPasswordRecuperationEmail(emailControl);
                },
                error: (error: Error) => {
                    if (error.message === "Cet email n'est pas associé à un utilisateur") {
                        if (emailControl) {
                            emailControl.setErrors({ emailNotFound: true });
                        }
                    }
                },
            });
        }
    }

    sendPasswordRecuperationEmail(emailControl: AbstractControl | null) {
        this.userService.sendPasswordRecuperationEmail(this.passwordRecuperationForm.value.email).subscribe({
            next: () => {
                this.dialogRef = this.dialog.open(UpdatePasswordDialogComponent, {
                    data: { isEmailSent: true, isPasswordUpdated: false },
                    panelClass: 'custom-modal',
                });
                this.codeValidationForm.reset();
                this.isEmailSent = true;
            },
            error: (error: Error) => {
                if (error.message === 'Erreur interne du serveur') {
                    if (emailControl) {
                        emailControl.setErrors({ serverError: true });
                        this.router.navigate(['/login']);
                    }
                }
            },
        });
    }

    verifyCode() {
        const codeControl = this.codeValidationForm.get('code');
        const validationCode = this.codeValidationForm.value.code.toString();

        if (this.codeValidationForm.valid && codeControl?.touched) {
            this.userService.verifyCode(validationCode).subscribe({
                next: () => {
                    this.isCodeValid = true;
                },
                error: (error: Error) => {
                    if (error.message === 'Code invalide') {
                        if (codeControl) {
                            codeControl.setErrors({ isEmailSent: false, invalidCode: true });
                        }
                    }
                },
            });
        }
    }

    resendEmail() {
        this.sendPasswordRecuperationEmail(this.passwordRecuperationForm.get('email'));
    }

    updatePassword() {
        const passwordControl = this.passwordResetForm.get('password');
        const passwordConfControl = this.passwordResetForm.get('passwordConf');

        if (this.passwordResetForm.valid && passwordControl?.touched && passwordControl.value === passwordConfControl?.value) {
            this.userService.updatePassword(this.resetPasswordUser, this.passwordResetForm.value.password).subscribe({
                next: () => {
                    this.dialogRef = this.dialog.open(UpdatePasswordDialogComponent, {
                        data: { isPasswordUpdated: true },
                        panelClass: 'custom-modal',
                    });
                    this.router.navigate(['/connection']);
                },
                error: (error: Error) => {
                    if (error.message === 'Erreur interne du serveur') {
                        if (passwordControl) {
                            passwordControl.setErrors({ serverError: true });
                        }
                    }
                },
            });
        }
    }

    private strictEmailValidator(): ValidatorFn {
        // TODO: fix this
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (control: AbstractControl): { [key: string]: any } | null => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            const valid = emailRegex.test(control.value);
            return valid ? null : { strictEmail: { value: control.value } };
        };
    }

    private passwordMatchValidator(controlName: string, matchingControlName: string) {
        return (formGroup: FormGroup) => {
            const control = formGroup.controls[controlName];
            const matchingControl = formGroup.controls[matchingControlName];
            if (matchingControl.errors && !matchingControl.errors.passwordMismatch) {
                return;
            }
            if (control.value !== matchingControl.value) {
                matchingControl.setErrors({ passwordMismatch: true });
            } else {
                matchingControl.setErrors(null);
            }
        };
    }
}
