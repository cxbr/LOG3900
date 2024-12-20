import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { GameData } from '@common/classes/game-data';
import { PageKeys, slideConfig } from 'src/assets/variables/game-card-options';

@Component({
    selector: 'app-select-page',
    templateUrl: './select-page.component.html',
    styleUrls: ['./select-page.component.scss'],
})
export class SelectPageComponent implements OnInit {
    @ViewChild('table-container', { static: true }) table: ElementRef;

    noGames: boolean = false;
    pageType: PageKeys = PageKeys.Selection;
    imgSource: string;
    slides: GameData[];
    slideConfig = slideConfig;

    constructor(private readonly gameCommunicationService: CommunicationHttpService) {}

    ngOnInit(): void {
        this.getSlidesFromServer();
    }

    setSelected(name: string): void {
        for (const slide of this.slides) {
            slide.isSelected = slide.name === name;
        }
    }

    private getSlidesFromServer(): void {
        this.gameCommunicationService.getAllGames().subscribe((res) => {
            if (res.length === 0) {
                this.noGames = true;
            }
            this.slides = res;
            for (const slide of this.slides) {
                slide.isSelected = false;
            }
        });
    }
}
