import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { PlayAreaService } from '@app/services/play-area/play-area.service';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-game-scoreboard',
    templateUrl: './game-scoreboard.component.html',
    styleUrls: ['./game-scoreboard.component.scss'],
})
export class GameScoreboardComponent implements OnChanges {
    @Input() gameName: string;
    @Input() timer: number;
    @Input() username: string;
    @Input() gameRoom: GameRoom;
    @Input() gameData: GameData;
    @Input() penaltyTime: number;
    @Input() restartSignal: boolean;
    @Input() isReplay = false;
    @Input() isObserver: boolean = false;
    @Output() sendDifferencesFound = new EventEmitter<number>();
    @Output() sendOpponentDifferencesFound = new EventEmitter<number>();
    @Output() sendSelectedPlayer = new EventEmitter<string | null>();

    isCheatModeActive: boolean;
    difficulty: string;
    totalNumber: number;
    lastDifferencesFound: number = 0;
    lastOpponentDifferencesFound: number = 0;
    minutes = 0;
    seconds = 0;
    selectedPlayer: string | null = null;

    constructor(private playAreaService: PlayAreaService) {}

    ngOnChanges() {
        if (this.gameRoom && this.gameData) {
            this.totalNumber = this.gameData.nbDifference;
            this.difficulty = this.gameData.difficulty;
            this.minutes = Math.floor(this.timer / Time.Sixty);
            this.seconds = this.timer % Time.Sixty;
        }
        this.isCheatModeActive = this.playAreaService.isCheatModeOn;
    }

    isAndroidByUsername(username: string): boolean {
        const player = this.gameRoom.userGame.currentPlayers.find((p) => p.username === username);
        return player ? player.isAndroid : false;
    }

    onPlayerSelect(): void {
        this.sendSelectedPlayer.emit(this.selectedPlayer);
    }
}
