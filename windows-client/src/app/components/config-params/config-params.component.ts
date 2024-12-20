import { Component, Input, OnInit } from '@angular/core';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { GameSetupService } from '@app/services/game-setup/game-setup.service';
import { Time } from 'src/assets/variables/time';

@Component({
    selector: 'app-config-params',
    templateUrl: './config-params.component.html',
    styleUrls: ['./config-params.component.scss'],
})
export class ConfigParamsComponent implements OnInit {
    @Input() gameDuration: number;
    @Input() penaltyTime: number;
    @Input() bonusTime: number;

    feedbackMessage: string = '';
    private timeout: number = Time.Thousand * 3;

    constructor(private readonly configCommunicationService: ConfigHttpService, private gameSetUpService: GameSetupService) {}

    ngOnInit() {
        this.gameSetUpService.refreshGamesAfterReload();
        this.configCommunicationService.getConstants().subscribe((res) => {
            this.gameDuration = res.gameDuration;
            this.penaltyTime = res.penaltyTime;
            this.bonusTime = res.bonusTime;
        });
    }

    applyNewConstants() {
        const constants = {
            gameDuration: this.gameDuration,
            penaltyTime: this.penaltyTime,
            bonusTime: this.bonusTime,
            cheatMode: false,
        };
        this.configCommunicationService.updateConstants(constants).subscribe();
        this.feedbackMessage = 'Nouvelles constantes appliquées avec succès !';
        setTimeout(() => {
            this.feedbackMessage = '';
            this.gameSetUpService.setConstants(constants);
        }, this.timeout);
    }

    resetConstants() {
        this.gameDuration = Time.Thirty;
        this.penaltyTime = Time.Five;
        this.bonusTime = Time.Five;
        const constants = {
            gameDuration: this.gameDuration,
            penaltyTime: this.penaltyTime,
            bonusTime: this.bonusTime,
            cheatMode: false,
        };
        this.configCommunicationService.updateConstants(constants).subscribe();
        this.feedbackMessage = 'Constantes réinitialisées avec succès !';
        setTimeout(() => {
            this.feedbackMessage = '';
            this.gameSetUpService.setConstants(constants);
        }, this.timeout);
    }
}
