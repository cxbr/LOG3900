import { Injectable } from '@angular/core';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameRoom } from '@common/classes/game-room';
import { GameFinderEvents } from '@common/enums/game-finder.gateway.variables';
import { GameMode } from '@common/game-mode';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameFinderService {
    gameExists$ = new Subject<boolean>();
    gameMode: string;
    constructor(private readonly socketService: CommunicationSocketService) {}

    getGames(gameName = undefined as unknown as string): Observable<GameRoom[]> {
        return new Observable((observer) => {
            this.socketService.on(GameFinderEvents.Games, (data: { games: GameRoom[]; gameName: string; gameMode: string }) => {
                if (
                    (this.gameMode === GameMode.limitedTimeMode && data.gameMode === GameMode.limitedTimeMode) ||
                    (this.gameMode === GameMode.classicMode && data.gameName === gameName && data.gameMode === GameMode.classicMode)
                ) {
                    observer.next(data.games);
                }
            });
            this.socketService.send(GameFinderEvents.GetGames, { gameMode: this.gameMode, gameName });
        });
    }
}
