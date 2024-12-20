import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameHistory, NewBestTime } from '@app/interfaces/game';
import { BestTime } from '@common/classes/best-time';
import { GameConstants } from '@common/classes/game-constants';
import { StatsUser } from '@common/classes/stats-user';
import { Observable, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root',
})
export class ConfigHttpService {
    private readonly baseUrl: string = environment.serverUrl;
    constructor(private readonly http: HttpClient) {}

    getHistory(): Observable<GameHistory[]> {
        return this.http.get<GameHistory[]>(`${this.baseUrl}/config/history`).pipe(catchError(this.handleError<GameHistory[]>('getHistory')));
    }

    getGameHistory(userId: string): Observable<GameHistory[]> {
        return this.http
            .get<GameHistory[]>(`${this.baseUrl}/config/history/${userId}`)
            .pipe(catchError(this.handleError<GameHistory[]>('getGameHistory')));
    }

    getConstants(): Observable<GameConstants> {
        return this.http.get<GameConstants>(`${this.baseUrl}/config/constants`).pipe(catchError(this.handleError<GameConstants>('getConstants')));
    }

    getBestTime(name: string): Observable<{ soloBestTimes: BestTime[]; vsBestTimes: BestTime[] }> {
        return this.http
            .get<{ soloBestTimes: BestTime[]; vsBestTimes: BestTime[] }>(`${this.baseUrl}/config/times/${name}`)
            .pipe(catchError(this.handleError<{ soloBestTimes: BestTime[]; vsBestTimes: BestTime[] }>('getBestTime')));
    }
    getStatsUser(userID: string, username: string): Observable<StatsUser> {
        return this.http
            .get<StatsUser>(`${this.baseUrl}/config/stats?id=${userID}&name=${username}`)
            .pipe(catchError(this.handleError<StatsUser>('getStatsUser')));
    }

    updateBestTime(name: string, newBestTime: NewBestTime): Observable<number> {
        return this.http
            .put<number>(`${this.baseUrl}/config/times/${name}`, newBestTime)
            .pipe(catchError(this.handleError<number>('updateBestTime')));
    }

    updateConstants(constants: GameConstants): Observable<HttpResponse<string>> {
        return this.http.put(`${this.baseUrl}/config/constants`, constants, { observe: 'response', responseType: 'text' });
    }

    deleteHistory(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/config/history`, { observe: 'response', responseType: 'text' });
    }

    deleteGameHistory(username: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/config/history/${username}`, { observe: 'response', responseType: 'text' });
    }

    deleteBestTimes(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/config/times`, { observe: 'response', responseType: 'text' });
    }

    deleteBestTime(name: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/config/times/${name}`, { observe: 'response', responseType: 'text' });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
