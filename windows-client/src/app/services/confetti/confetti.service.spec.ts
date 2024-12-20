/* eslint-disable @typescript-eslint/no-explicit-any */
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { EndGame } from '@app/interfaces/game';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { ConfettiService } from '@app/services/confetti/confetti.service';
import { PlayAreaService } from '@app/services/play-area/play-area.service';
import { GameRoom } from '@common/classes/game-room';
import { Subject } from 'rxjs';
import { GameService } from '@app/services/game/game.service';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

describe('ConfettiService', () => {
    let service: ConfettiService;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let component: PlayAreaComponent;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'timer$',
            'totalDifferencesFound$',
            'userDifferencesFound$',
            'gameFinished$',
            'gameRoom$',
            'getConstant',
            'gameConstants',
            'abandoned$',
            'serverValidateResponse$',
            'cheatModeResponse$',
            'reset',
            'sendMessage',
            'isLimitedTimeMode',
            'changeTime',
            'endGame',
            'abandonGame',
            'disconnectSocket',
            'turnOffGameSocket',
        ]);
        gameServiceSpy.timer$ = new Subject<number>();
        gameServiceSpy.totalDifferencesFound$ = new Subject<number>();
        gameServiceSpy.userDifferencesFound$ = new Subject<number>();
        gameServiceSpy.gameFinished$ = new Subject<EndGame>();
        gameServiceSpy.gameRoom$ = new Subject<GameRoom>();
        gameServiceSpy.abandoned$ = new Subject<string>();
        gameServiceSpy.serverValidateResponse$ = new Subject<DifferenceTry>();
        gameServiceSpy.cheatModeResponse$ = new Subject<boolean>();
        gameServiceSpy.gameConstants = { gameDuration: 10, penaltyTime: 10, bonusTime: 0, cheatMode: false };
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, AppRoutingModule, DynamicTestModule],
            providers: [ConfettiService, PlayAreaService, { provide: GameService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        service = TestBed.inject(ConfettiService);
        const playAreaService = TestBed.inject(PlayAreaService);
        (service as any).playAreaService = playAreaService;
        (service as any).playAreaService.setComponent(component);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set playAreaService', () => {
        const playAreaService = TestBed.inject(PlayAreaService);
        service.setService(playAreaService);
        expect((service as any).playAreaService).toBe(playAreaService);
    });

    it('should start confetti without coordinates', fakeAsync(() => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        spyOn(Math, 'random').and.returnValue(0.5);
        spyOn(window, 'setTimeout').and.callThrough();
        spyOn(window, 'setInterval').and.callThrough();
        (service as any).playAreaService.setSpeed(1);
        service.startConfetti(undefined);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        tick(15000);
        expect((service as any).intervalId).toBeDefined();
        expect(window.setInterval).toHaveBeenCalled();
        discardPeriodicTasks();
    }));

    it('should create a canvas element when given coordinates', (done) => {
        // const webviewTag = {} as WebviewTag;
        const canvas = document.createElement('canvas');
        spyOn(canvas, 'getContext').and.callThrough();
        spyOn(document, 'createElement').and.callFake((elementType: string) => {
            // You can manipulate the argument passed to createElement here
            if (elementType === 'canvas') {
                // Return the pre-defined canvas element
                return canvas;
            } else {
                // Call the original createElement function with the provided arguments
                return jasmine.createSpyObj('element', ['getContext']); // Or whatever you want to return for other element types
            }
        });
        // document.createElement('canvas');
        service.startConfetti({ x: 100, y: 200 });
        setTimeout(() => {
            // eslint-disable-next-line deprecation/deprecation
            expect(document.createElement as jasmine.Spy).toHaveBeenCalledWith('canvas');
            expect(canvas.getContext).toHaveBeenCalledWith('2d');
            done();
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        }, 1000);
    });
});
