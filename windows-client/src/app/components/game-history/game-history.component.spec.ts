import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfigParamsComponent } from '@app/components/config-params/config-params.component';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { GameConstants } from '@common/classes/game-constants';
import { of } from 'rxjs';
import { GameHistoryComponent } from './game-history.component';
import SpyObj = jasmine.SpyObj;

@NgModule({
    imports: [MatDialogModule, HttpClientModule],
})
export class DynamicTestModule {}

describe('GameHistoryComponent', () => {
    let component: GameHistoryComponent;
    let fixture: ComponentFixture<GameHistoryComponent>;
    let communicationServiceSpy: SpyObj<CommunicationHttpService>;
    let configHttpServiceSpy: SpyObj<ConfigHttpService>;
    let dialog: MatDialog;
    let router: Router;
    let dialogRefSpy: SpyObj<MatDialogRef<DeleteDialogComponent>>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getAllGames', 'deleteGame', 'deleteAllGames']);
        communicationServiceSpy.getAllGames.and.returnValue(
            of([
                {
                    name: 'Find the Differences 1',

                    nbDifference: 10,
                    image1url: 'https://example.com/image1.jpg',
                    image2url: 'https://example.com/image2.jpg',
                    difficulty: 'easy',
                    wantShoutout: true,
                    creator: 'player1',
                    soloBestTimes: [
                        { name: 'player1', time: 200 },
                        { name: 'player2', time: 150 },
                    ],
                    vsBestTimes: [{ name: 'player1', time: 200 }],
                    differenceMatrix: [[]],
                    differenceHashMap: [],
                    isSelected: false,
                },
                {
                    name: 'Find the Differences 2',

                    nbDifference: 15,
                    wantShoutout: true,
                    creator: 'player1',
                    image1url: 'https://example.com/image3.jpg',
                    image2url: 'https://example.com/image4.jpg',
                    difficulty: 'medium',
                    differenceHashMap: [],
                    soloBestTimes: [
                        { name: 'player3', time: 300 },
                        { name: 'player4', time: 250 },
                    ],
                    vsBestTimes: [{ name: 'player3', time: 200 }],
                    differenceMatrix: [[]],
                    isSelected: false,
                },
            ]),
        );
        communicationServiceSpy.deleteAllGames.and.returnValue(of(new HttpResponse({ status: 200 }) as HttpResponse<string>));
        communicationServiceSpy.deleteGame.and.returnValue(of(new HttpResponse({ status: 200 }) as HttpResponse<string>));
        configHttpServiceSpy = jasmine.createSpyObj('ConfigHttpService', [
            'getConstants',
            'deleteBestTime',
            'deleteGameHistory',
            'deleteBestTimes',
            'getHistory',
            'getGameHistory',
        ]);

        configHttpServiceSpy.getHistory.and.returnValue(
            of([
                {
                    name: 'Find the difference 1',
                    startTime: 100,
                    timer: 200,
                    players: ['user1'],
                    _id: 'FakeId',
                    gameMode: 'classic-mode solo',
                    winner: 'user1',
                },
            ]),
        );
        configHttpServiceSpy.getGameHistory.and.returnValue(
            of([
                {
                    name: 'Find the difference 1',
                    startTime: 100,
                    timer: 200,
                    players: ['user1'],
                    _id: 'FakeId',
                    gameMode: 'classic-mode solo',
                    winner: 'user1',
                },
            ]),
        );
        configHttpServiceSpy.getConstants.and.returnValue(of({ gameDuration: 100, penaltyTime: 10, bonusTime: 5 } as GameConstants));
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            imports: [DynamicTestModule, RouterTestingModule, AppRoutingModule, CommonModule, HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            declarations: [ConfigParamsComponent, GameCardComponent],
            providers: [
                { provide: CommunicationHttpService, useValue: communicationServiceSpy },
                { provide: ConfigHttpService, useValue: configHttpServiceSpy },
                { provide: MatDialog, useValue: dialog },
            ],
        }).compileComponents();
        router = TestBed.inject(Router);
        spyOnProperty(router, 'url', 'get').and.returnValue('/config');
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        (dialog.open as jasmine.Spy).and.returnValue(dialogRefSpy);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('deleteParties should call deleteHistory if user responded yes', () => {
        dialogRefSpy.afterClosed.and.returnValue(of(true));
        // component.pageType = PageKeys.Config;
        configHttpServiceSpy.deleteGameHistory.and.returnValue(of(new HttpResponse({ status: 200 }) as HttpResponse<string>));
        component.deleteParties();
        expect(configHttpServiceSpy.deleteGameHistory).toHaveBeenCalled();
        expect(component.parties.length).toEqual(0);
        expect(dialog.open).toHaveBeenCalledWith(DeleteDialogComponent, { data: { action: 'deleteHistory' }, panelClass: 'custom-modal' });
        expect(dialogRefSpy.afterClosed).toHaveBeenCalled();
    });

    it("deleteParties shouldn't call deleteHistory if user responded no", () => {
        dialogRefSpy.afterClosed.and.returnValue(of(false));
        // component.pageType = PageKeys.Config;
        component.deleteParties();
        expect(dialog.open).toHaveBeenCalledWith(DeleteDialogComponent, { data: { action: 'deleteHistory' }, panelClass: 'custom-modal' });
        expect(dialogRefSpy.afterClosed).toHaveBeenCalled();
        // expect(component.slides.length).toEqual(2);
    });

    it('calculateTime should return the correct time', () => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const time = component.calculateTime(204204);
        expect(time).toEqual('03:24');
    });
});
