/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, OnInit } from '@angular/core';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { UserService } from '@app/services/user/user.service';
@Component({
    selector: 'app-game-statistics',
    templateUrl: './game-statistics.component.html',
    styleUrls: ['./game-statistics.component.scss'],
})
export class GameStatisticsComponent implements OnInit {
    numberGames: number;
    numberWinGames: number;
    averageGameDiff: number;
    averageTimerGame: number;

    constructor(private configCommunicationService: ConfigHttpService, private userService: UserService) {}

    ngOnInit(): void {
        this.getStatsFromServer();
    }

    formatTime(time: number): string {
        const totalSeconds = Math.floor(time / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        let formattedMinutes = String(minutes);
        let formattedSeconds = String(seconds);
        if (minutes < 10) {
            formattedMinutes = String(minutes).padStart(2, '0');
        }
        if (seconds < 10) {
            formattedSeconds = String(seconds).padStart(2, '0');
        }

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    private getStatsFromServer(): void {
        const userId = this.userService.loggedInUser?._id || '';
        const username = this.userService.loggedInUser?.username || '';

        this.configCommunicationService.getStatsUser(userId, username).subscribe((res) => {
            this.averageGameDiff = Math.ceil(res.averageDiff * 10) / 10;
            this.averageTimerGame = res.averageTimer;
            this.numberGames = Math.ceil(res.countGame * 10) / 10;
            this.numberWinGames = Math.ceil(res.countGameWin * 10) / 10;
        });
    }
}
