import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Connection, LoginUser, NewUser, ResetPasswordUser, User, UserAvatar } from '@app/interfaces/user';
import { GameRating } from '@common/classes/game-rating';
import { RatingFormat } from '@common/classes/rating-format';
import { UserProfile } from '@common/classes/user-profile';
import { UserProfileUI } from '@common/classes/user-profile-ui';

import { Observable, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root',
})
export class UserHttpService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    signUp(newUser: NewUser): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/user/signup`, newUser, { observe: 'response', responseType: 'text' });
    }

    login(user: LoginUser): Observable<User> {
        return this.http.post<User>(`${this.baseUrl}/user/login`, user);
    }

    logout(username: string): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/user/logout/${username}`, null, { observe: 'response', responseType: 'text' });
    }

    updateUser(user: User): Observable<HttpResponse<string>> {
        return this.http.put(`${this.baseUrl}/user/update-username`, user, { observe: 'response', responseType: 'text' });
    }

    getUsername(id: string): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/user/${id}`).pipe(catchError(this.handleError<string>('getUsername')));
    }

    updateConnectionHistory(connection: Connection): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/user/connections`, connection, { observe: 'response', responseType: 'text' });
    }

    getConnectionHistory(userId: string): Observable<Connection[]> {
        return this.http.get<Connection[]>(`${this.baseUrl}/user/connections/${userId}`);
    }

    getUserByEmail(email: string): Observable<ResetPasswordUser> {
        return this.http.get<ResetPasswordUser>(`${this.baseUrl}/user/by-email/${email}`);
    }

    // For development purposes only
    deleteAllConnectionHistory(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/user/connections`, { observe: 'response', responseType: 'text' });
    }

    sendPasswordRecuperationEmail(email: string): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/user/send-recup-email`, { email }, { observe: 'response', responseType: 'text' });
    }

    verifyCode(code: string): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/user/verify-code`, { code }, { observe: 'response', responseType: 'text' });
    }

    updatePassword(user: User): Observable<HttpResponse<string>> {
        return this.http.put(`${this.baseUrl}/user/update-password`, user, { observe: 'response', responseType: 'text' });
    }

    getPredefinedAvatars(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/user/avatars`);
    }

    setAvatar(avatar: UserAvatar): Observable<UserAvatar> {
        return this.http.patch<UserAvatar>(`${this.baseUrl}/user/avatar`, avatar);
    }

    saveReview(rating: RatingFormat): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/game/rating`, rating, { observe: 'response', responseType: 'text' });
    }

    getAverageRating(gameName: string): Observable<GameRating> {
        return this.http.get<GameRating>(`${this.baseUrl}/game/gameReviews/${gameName}`);
    }

    getUsernameUI(userId: string): Observable<UserProfileUI> {
        return this.http.get<UserProfileUI>(`${this.baseUrl}/user/username-color/${userId}`);
    }

    getUserIdByUsername(username: string): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/user/username/${username}`);
    }

    getUsernameById(userId: string): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/user/id/${userId}`);
    }

    getUserList(userId: string): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.baseUrl}/user/list/${userId}`);
    }

    getFriendList(userId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/user/friend-list/${userId}`);
    }

    getFriendNotificationCount(userId: string): Observable<number> {
        return this.http.get<number>(`${this.baseUrl}/user/friend-requests/${userId}`);
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
