import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SignupInfoModel } from '@app/classes/signup-info-model';
import { AvatarComponent } from '@app/components/avatar/avatar.component';
import { Connection, LoginUser, NewUser } from '@app/interfaces/user';
import { AvatarService } from '@app/services/avatar/avatar.service';
import { GlobalChatService } from '@app/services/global-chat/global-chat.service';
import { UserService } from '@app/services/user/user.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { ConnectionType } from '@common/connection-type';

@Component({
    selector: 'app-signup-page',
    templateUrl: './signup-page.component.html',
    styleUrls: ['./signup-page.component.scss'],
})
export class SignupPageComponent implements OnInit, OnDestroy {
    @ViewChild('avatar') avatarComponent: AvatarComponent;

    signupForm: FormGroup;
    buttonClicked: boolean = false;
    emailStatus$: string;
    usernameStatus$: string;
    passwordStatus$: string;
    passwordConfStatus$: string;

    // eslint-disable-next-line max-params
    constructor(
        private userService: UserService,
        private fb: FormBuilder,
        private readonly router: Router,
        private readonly avatarService: AvatarService,
        private readonly verifyInputService: VerifyInputService,
        private globalChatService: GlobalChatService,
    ) {
        this.signupForm = this.fb.group(
            {
                email: ['', [Validators.required, this.strictEmailValidator()]],
                username: ['', [Validators.required, this.familyFriendlyUsernameValidator()]],
                password: ['', Validators.required],
                passwordConf: ['', Validators.required],
            },
            { validator: this.passwordMatchValidator('password', 'passwordConf') } as AbstractControlOptions,
        );
        this.signupForm.get('passwordConf')?.statusChanges.subscribe((status) => {
            this.passwordConfStatus$ = status;
        });
        this.signupForm.get('password')?.statusChanges.subscribe((status) => {
            this.passwordStatus$ = status;
        });
        this.signupForm.get('username')?.statusChanges.subscribe((status) => {
            this.usernameStatus$ = status;
        });
        this.signupForm.get('email')?.statusChanges.subscribe((status) => {
            this.emailStatus$ = status;
        });
        this.signupForm.get('username')?.valueChanges.subscribe(() => {
            if (this.signupForm.get('username')?.hasError('usernameTaken')) {
                this.signupForm.get('username')?.setErrors({ usernameTaken: null });
                this.signupForm.get('username')?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
            }
        });
    }

    ngOnInit(): void {
        this.signupForm.setValue({
            username: SignupInfoModel.prototype.username,
            email: SignupInfoModel.prototype.email,
            password: SignupInfoModel.prototype.password,
            passwordConf: SignupInfoModel.prototype.passwordConf,
        });
    }

    ngOnDestroy(): void {
        const info = this.signupForm.value;
        SignupInfoModel.setInfo(info);
    }

    onEnterKeyPressed(): void {
        this.signupForm.get('password')?.markAsTouched();
        this.signupForm.get('passwordConf')?.markAsTouched();
        this.signupForm.get('username')?.markAsTouched();
        this.signupForm.get('email')?.markAsTouched();

        if (this.signupForm.valid) {
            this.signUp();
        }
    }

    signUp() {
        this.avatarComponent.toggleMatError();

        const emailControl = this.signupForm.get('email');
        const passwordControl = this.signupForm.get('password');
        const passwordConfControl = this.signupForm.get('passwordConf');
        const usernameControl = this.signupForm.get('username');

        emailControl?.markAsTouched();
        passwordControl?.markAsTouched();
        passwordConfControl?.markAsTouched();
        usernameControl?.markAsTouched();

        if (this.signupForm.valid && emailControl?.touched && passwordControl?.value === passwordConfControl?.value && this.isAvatarChosen()) {
            const avatar: string = this.avatarService.getAvatar();

            const newUser: NewUser = {
                username: this.signupForm.value.username,
                email: this.signupForm.value.email,
                password: this.signupForm.value.password,
                avatar: this.avatarService.getIsLocalFile() ? null : avatar,
                avatarData: this.avatarService.getIsLocalFile() ? avatar : null,
            };
            this.userService.createNewUser(newUser).subscribe({
                next: (response) => {
                    const userId = response.body as string;
                    const connection: Connection = {
                        userId,
                        username: newUser.username,
                        connectionType: ConnectionType.accountCreation,
                        connectionTime: Date.now(),
                    };
                    this.userService.updateConnectionHistory(connection);
                    const user: LoginUser = {
                        username: this.signupForm.value.username,
                        password: this.signupForm.value.password,
                    };

                    this.userService.loginAfterSocket(user).subscribe({
                        next: (token) => {
                            const connect: Connection = {
                                userId: token._id as string,
                                username: user.username,
                                connectionType: ConnectionType.connection,
                                connectionTime: Date.now(),
                            };
                            this.userService.updateConnectionHistory(connect);
                            this.userService.loggedInUser = token;
                            this.avatarService.setNetworkAvatar(token.avatar as string);
                            this.userService.userLoggedIn();
                            this.globalChatService.onLogin();
                            localStorage.setItem(this.userService.tokenKey, token.username);
                            this.router.navigate(['/home']);
                        },
                        error: (error: Error) => {
                            if (error.message === 'Utilisateur est déjà connecté') {
                                usernameControl?.setErrors({ usernameTaken: true });
                            }
                            if (error.message === "Nom d'utilisateur ou mot de passe incorrect") {
                                passwordControl?.setErrors({ wrongPassword: true });
                            }
                        },
                    });
                },
                error: (error: Error) => {
                    if (error.message === "Ce nom d'utilisateur est déjà pris") {
                        if (usernameControl) {
                            usernameControl.setErrors({ usernameTaken: true });
                        }
                    }
                    if (error.message === 'Cet email est déjà pris') {
                        if (emailControl) {
                            emailControl.setErrors({ emailTaken: true });
                        }
                    }
                },
            });
        }
    }

    navigateToConnection(): void {
        SignupInfoModel.resetInfo();
        this.signupForm.setValue({
            username: null,
            email: null,
            password: null,
            passwordConf: null,
        });
        this.avatarService.resetAvatar();
        this.router.navigate(['/connection']);
    }

    private isAvatarChosen(): boolean {
        return this.avatarComponent.avatar !== '';
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

    private familyFriendlyUsernameValidator(): ValidatorFn {
        // TODO: fix this
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (control: AbstractControl): { [key: string]: any } | null => {
            if (control.value === '' || control.value === undefined || control.value === null) {
                return null;
            }

            const valid = this.verifyInputService.verify(control.value);
            return valid ? null : { vulgarName: { value: control.value } };
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
