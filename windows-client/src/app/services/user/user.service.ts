import { HttpResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Connection, LoginUser, NewUser, ResetPasswordUser, User, UserAvatar } from '@app/interfaces/user';
import { AvatarService } from '@app/services/avatar/avatar.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { UserHttpService } from '@app/services/user-http/user-http.service';
import { UserProfile } from '@common/classes/user-profile';
import { UserProfileUI } from '@common/classes/user-profile-ui';
import { UserEvents } from '@common/enums/user.gateway.variables';
import * as crypto from 'crypto-js';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    loggedInUser: User | null = null;
    tokenKey = 'token';
    usernameColorCache = new Map<string, UserProfileUI>();
    // eslint-disable-next-line max-params
    constructor(
        private userHttpService: UserHttpService,
        private readonly router: Router,
        private socketService: CommunicationSocketService,
        private readonly avatarService: AvatarService,
    ) {
        this.socketService.connect();
    }

    createNewUser(newUser: NewUser): Observable<HttpResponse<string>> {
        this.hashPassword(newUser);
        return this.userHttpService.signUp(newUser).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.BadRequest) {
                    errorMessage = "Ce nom d'utilisateur est déjà pris";
                }
                if (error.status === HttpStatusCode.Conflict) {
                    errorMessage = 'Cet email est déjà pris';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    login(user: LoginUser): Observable<User> {
        this.hashPassword(user);
        return this.userHttpService.login(user).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.Unauthorized) {
                    errorMessage = "Nom d'utilisateur ou mot de passe incorrect";
                } else if (error.status === HttpStatusCode.BadRequest) {
                    errorMessage = 'Utilisateur est déjà connecté';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    logout(): void {
        this.avatarService.resetAvatar();
        this.loggedInUser = null;
        this.socketService.send(UserEvents.UserDisconnected);
        this.router.navigate(['/connection']);
    }

    isUserConnected(username: string) {
        this.socketService.send(UserEvents.IsUserConnected, username);
    }

    loginAfterSocket(user: LoginUser): Observable<User> {
        return new Observable((observer) => {
            this.socketService.on(UserEvents.IsUserConnected, (isConnected: boolean) => {
                if (!isConnected) {
                    this.login(user).subscribe({
                        next: (token) => observer.next(token),
                        error: (error) => observer.error(error),
                    });
                } else {
                    observer.error(new Error('Utilisateur est déjà connecté'));
                }
            });
            this.isUserConnected(user.username);
        });
    }

    getCurrentUserId(): string | null {
        return this.loggedInUser ? this.loggedInUser._id : null; // Or this.loggedInUser.username
    }

    isLoggedIn(): boolean {
        const token = localStorage.getItem(this.tokenKey);
        return token != null && token.length > 0;
    }

    getToken(): string | null {
        return this.isLoggedIn() ? localStorage.getItem(this.tokenKey) : null;
    }

    userLoggedIn(): void {
        this.socketService.send(UserEvents.UserConnected, { username: this.loggedInUser?.username, isConnectedToAndroid: false });
    }

    updateConnectionHistory(connection: Connection): void {
        this.userHttpService.updateConnectionHistory(connection).subscribe();
    }

    async setAvatar(data: { [x: string]: string }): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const avatar: UserAvatar = {
                _id: this.loggedInUser?._id as string,
                avatar: data.isLocalImage ? null : data.avatarData,
                avatarData: data.isLocalImage ? data.avatarData : null,
            };
            this.userHttpService.setAvatar(avatar).subscribe({
                next: (userAvatar) => {
                    this.avatarService.setNetworkAvatar(`${userAvatar.avatar}?${uuidv4()}`);
                    if (this.usernameColorCache.has(this.loggedInUser?.username as string)) {
                        const userProfileUI = this.usernameColorCache.get(this.loggedInUser?.username as string) as UserProfileUI;
                        userProfileUI.avatar = `${userAvatar.avatar}?${uuidv4()}`;
                        this.usernameColorCache.set(this.loggedInUser?.username as string, userProfileUI);
                    }
                    resolve();
                },
                error: (error) => {
                    reject(error);
                },
            });
        });
    }

    updateUsername(newUserName: string): Observable<HttpResponse<string>> {
        const oldKey = this.loggedInUser?.username as string;
        const oldPassword = this.decryptPassword(this.loggedInUser?.password as string, this.loggedInUser?.username as string);
        // TODO: add dto to remove useless email field
        const user = {
            username: newUserName as string,
            email: 'nd@nd.com',
            password: oldPassword as string,
            _id: this.loggedInUser?._id as string,
        };
        this.hashPassword(user);
        return this.userHttpService.updateUser(user).pipe(
            tap(() => {
                this.socketService.send(UserEvents.UserDisconnected);
                localStorage.setItem(this.tokenKey, newUserName);
                if (this.loggedInUser) {
                    this.loggedInUser.username = newUserName;
                    this.loggedInUser.password = user.password;
                }
                this.userLoggedIn();
                if (this.usernameColorCache.has(oldKey)) {
                    const userProfileUI = this.usernameColorCache.get(oldKey) as UserProfileUI;
                    this.usernameColorCache.delete(oldKey);
                    this.usernameColorCache.set(newUserName, userProfileUI);
                }
            }),
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.BadRequest) {
                    errorMessage = "Ce nom d'utilisateur est déjà pris";
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    // For development purposes only
    deleteAllConnectionHistory(): void {
        this.userHttpService.deleteAllConnectionHistory().subscribe();
    }

    getUserByEmail(email: string): Observable<ResetPasswordUser> {
        return this.userHttpService.getUserByEmail(email).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.NotFound) {
                    errorMessage = "Cet email n'est pas associé à un utilisateur";
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    sendPasswordRecuperationEmail(email: string): Observable<HttpResponse<string>> {
        return this.userHttpService.sendPasswordRecuperationEmail(email).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.InternalServerError) {
                    errorMessage = 'Erreur interne du serveur';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    verifyCode(code: string): Observable<HttpResponse<string>> {
        return this.userHttpService.verifyCode(code).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.BadRequest) {
                    errorMessage = 'Code invalide';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    updatePassword(resetPasswordUser: ResetPasswordUser, newPassword: string): Observable<HttpResponse<string>> {
        // TODO: add dto to remove useless email field
        const user = {
            username: resetPasswordUser.username,
            email: 'nd@nd.com',
            password: newPassword,
            _id: resetPasswordUser.userId,
        };
        this.hashPassword(user);
        return this.userHttpService.updatePassword(user).pipe(
            tap(() => {
                if (this.loggedInUser && this.loggedInUser.username === user.username) {
                    this.loggedInUser.password = user.password;
                }
            }),
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.InternalServerError) {
                    errorMessage = 'Erreur interne du serveur';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    getUsernameUI(userId: string, username: string): Observable<UserProfileUI> {
        const cachedProfileUI = this.usernameColorCache.get(username);
        if (cachedProfileUI) {
            return of(cachedProfileUI);
        }
        return this.userHttpService.getUsernameUI(userId).pipe(
            tap((result) => {
                this.usernameColorCache.set(username, result);
            }),
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.InternalServerError) {
                    errorMessage = 'Erreur interne du serveur';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    getUsernameById(userId: string): Observable<string> {
        return this.userHttpService.getUsernameById(userId).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.NotFound) {
                    errorMessage = 'Utilisateur non trouvé';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    getUserIdByUsername(username: string): Observable<string> {
        return this.userHttpService.getUserIdByUsername(username).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.NotFound) {
                    errorMessage = 'Utilisateur non trouvé';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    getUserList(): Observable<UserProfile[]> {
        // eslint-disable-next-line no-underscore-dangle
        return this.userHttpService.getUserList(this.loggedInUser?._id as string).pipe(
            tap(() => {
                catchError((error) => {
                    let errorMessage = 'Une erreur est survenue';
                    if (error.status === HttpStatusCode.InternalServerError) {
                        errorMessage = 'Erreur interne du serveur';
                    }
                    return throwError(() => new Error(errorMessage));
                });
            }),
        );
    }

    getFriendList(userId: string): Observable<string[]> {
        // eslint-disable-next-line no-underscore-dangle
        return this.userHttpService.getFriendList(userId).pipe(
            tap(() => {
                catchError((error) => {
                    let errorMessage = 'Une erreur est survenue';
                    if (error.status === HttpStatusCode.InternalServerError) {
                        errorMessage = 'Erreur interne du serveur';
                    }
                    return throwError(() => new Error(errorMessage));
                });
            }),
        );
    }

    getFriendNotificationCount(userId: string): Observable<number> {
        // eslint-disable-next-line no-underscore-dangle
        return this.userHttpService.getFriendNotificationCount(userId).pipe(
            tap(() => {
                catchError((error) => {
                    let errorMessage = 'Une erreur est survenue';
                    if (error.status === HttpStatusCode.InternalServerError) {
                        errorMessage = 'Erreur interne du serveur';
                    }
                    return throwError(() => new Error(errorMessage));
                });
            }),
        );
    }

    getUsernameByUserId(userId: string): Observable<string> {
        return this.userHttpService.getUsername(userId).pipe(
            catchError((error) => {
                let errorMessage = 'Une erreur est survenue';
                if (error.status === HttpStatusCode.NotFound) {
                    errorMessage = 'Utilisateur non trouvé';
                }
                return throwError(() => new Error(errorMessage));
            }),
        );
    }

    private hashPassword(user: LoginUser | NewUser): void {
        const key = crypto.enc.Utf8.parse(crypto.MD5(user.username).toString());
        const iv = '0102030405060708090a0b0c0d0e0f10';
        user.password = crypto.AES.encrypt(user.password, key, {
            mode: crypto.mode.ECB,
            iv: crypto.enc.Utf8.parse(iv),
        }).toString();
    }

    private decryptPassword(encryptedPassword: string, username: string): string {
        const key = crypto.enc.Utf8.parse(crypto.MD5(username).toString());
        const iv = '0102030405060708090a0b0c0d0e0f10';
        const decrypted = crypto.AES.decrypt(encryptedPassword, key, {
            mode: crypto.mode.ECB,
            iv: crypto.enc.Utf8.parse(iv),
        });
        return decrypted.toString(crypto.enc.Utf8);
    }
}
