import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NewReplay, Replay } from '@common/classes/replay';

import { Observable, catchError, of } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
    providedIn: 'root',
})
export class ReplayHttpService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(private readonly http: HttpClient) {}

    getAllReplays(): Observable<Replay[]> {
        return this.http.get<Replay[]>(`${this.baseUrl}/replay`).pipe(catchError(this.handleError<Replay[]>('getAllReplays')));
    }

    getReplay(replayId: string): Observable<Replay> {
        return this.http.get<Replay>(`${this.baseUrl}/replay/${replayId}`).pipe(catchError(this.handleError<Replay>('getReplay')));
    }

    createNewReplay(newReplay: NewReplay): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/replay`, newReplay, { observe: 'response', responseType: 'text' });
    }

    deleteReplay(replayId: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/replay/${replayId}`, { observe: 'response', responseType: 'text' });
    }

    updateReplay(replay: Replay): Observable<HttpResponse<string>> {
        return this.http.put(`${this.baseUrl}/replay`, replay, { observe: 'response', responseType: 'text' });
    }

    deleteAllReplay(): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/replay`, { observe: 'response', responseType: 'text' });
    }

    deleteAllUserReplays(userId: string): Observable<HttpResponse<string>> {
        return this.http.delete(`${this.baseUrl}/replay/user/${userId}`, { observe: 'response', responseType: 'text' });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
