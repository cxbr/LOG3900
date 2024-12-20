import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Connection, LoginUser } from '@app/interfaces/user';
import { AvatarService } from '@app/services/avatar/avatar.service';
import { GlobalChatService } from '@app/services/global-chat/global-chat.service';
import { UserService } from '@app/services/user/user.service';
import { ConnectionType } from '@common/connection-type';

@Component({
    selector: 'app-connection-page',
    templateUrl: './connection-page.component.html',
    styleUrls: ['./connection-page.component.scss'],
})
export class ConnectionPageComponent {
    loginForm: FormGroup;
    buttonClicked: boolean = false;

    // eslint-disable-next-line max-params
    constructor(
        private userService: UserService,
        private readonly router: Router,
        private fb: FormBuilder,
        private readonly avatarService: AvatarService,
        private globalChatService: GlobalChatService,
    ) {
        this.loginForm = this.fb.group({
            username: [this.userService.getToken(), Validators.required],
            password: ['', Validators.required],
        });
        if (this.userService.getToken() !== null) {
            this.loginForm.get('username')?.markAsTouched();
        }
    }

    onEnterKeyPressed(): void {
        this.loginForm.get('password')?.markAsTouched();

        if (this.loginForm.valid) {
            this.connect();
        }
    }

    clearErrors(): void {
        const usernameControl = this.loginForm.get('username');
        if (usernameControl?.errors && !usernameControl.errors.required) {
            const requiredError = usernameControl.errors.required ? { required: true } : null;
            usernameControl.setErrors(requiredError);
        }
        const passwordControl = this.loginForm.get('password');
        if (passwordControl?.errors && !passwordControl.errors.required) {
            const requiredError = passwordControl.errors.required ? { required: true } : null;
            passwordControl.setErrors(requiredError);
        }
    }

    connect() {
        this.buttonClicked = true;
        const passwordControl = this.loginForm.get('password');
        const usernameControl = this.loginForm.get('username');
        usernameControl?.setErrors(null);
        passwordControl?.setErrors(null);
        if (!usernameControl?.value) {
            usernameControl?.setErrors({ required: true });
        }
        if (!passwordControl?.value) {
            passwordControl?.setErrors({ required: true });
        }
        if (!this.loginForm.valid) {
            return;
        }
        const user: LoginUser = {
            username: this.loginForm.value.username,
            password: this.loginForm.value.password,
        };
        this.userService.loginAfterSocket(user).subscribe({
            next: (token) => {
                const connection: Connection = {
                    userId: token._id as string,
                    username: user.username,
                    connectionType: ConnectionType.connection,
                    connectionTime: Date.now(),
                };
                this.userService.updateConnectionHistory(connection);
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
    }
}
