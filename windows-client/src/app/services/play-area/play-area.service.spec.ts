/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ElementRef, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { EndGame } from '@app/interfaces/game';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { DetectionDifferenceService } from '@app/services/detection-difference/detection-difference.service';
import { GameService } from '@app/services/game/game.service';
import { PlayAreaService } from '@app/services/play-area/play-area.service';
import { GameRoom } from '@common/classes/game-room';
import { Color } from '@common/enums/color';
import { Subject } from 'rxjs';
import { PossibleColor } from 'src/assets/variables/images-values';
import { Dimensions } from 'src/assets/variables/picture-dimension';
import { Time } from 'src/assets/variables/time';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

describe('PlayAreaService', () => {
    let service: PlayAreaService;
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
            'sendServerDifference',
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
            providers: [PlayAreaService, PlayAreaComponent, DetectionDifferenceService, { provide: GameService, useValue: gameServiceSpy }],
        });
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        service = TestBed.inject(PlayAreaService);
        spyOn(component as any, 'gameService').and.stub();
        (service as any).normalComponent = component;
        component.differenceMatrix = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        fixture.detectChanges();
        component.ngAfterViewInit();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set playAreaComponent', () => {
        spyOn(service, 'endCheatMode').and.stub();
        service.setComponent(component);
        expect((service as any).component).toEqual(component);
        expect((service as any).replay).toBeFalsy();
        expect((service as any).normalComponent).toEqual(component);
    });

    it('should setCheatMode', () => {
        service.setCheatMode();
        expect((service as any).isCheatModeOn).toBeFalsy();
    });

    it('should set speed', () => {
        service.setSpeed(1);
        expect((service as any).speed).toEqual(1);
    });

    it('should clearAsync', () => {
        spyOn(window, 'clearInterval').and.stub();
        service.clearAsync();
        expect(window.clearInterval).toHaveBeenCalled();
    });

    it('should call start confetti without coordinates', () => {
        service.setComponent(component);
        const startConfettiSpy = spyOn((service as any).confettiService, 'startConfetti').and.stub();
        service.setSpeed(1);
        service.startConfetti(undefined);
        expect(startConfettiSpy).toHaveBeenCalledWith(undefined);
    });

    it('should call start confetti with coordinates', () => {
        service.setComponent(component);
        const startConfettiSpy = spyOn((service as any).confettiService, 'startConfetti').and.stub();
        service.startConfetti({ x: 100, y: 200 });
        expect(startConfettiSpy).toHaveBeenCalledWith({ x: 100, y: 200 });
    });

    it('should not start cheat mode if component contexts are not set', () => {
        spyOn(service, 'endCheatMode');
        (service as any).component.context1 = null;
        (service as any).component.context2 = null;
        service.cheatMode();
        expect(service.endCheatMode).not.toHaveBeenCalled();
    });

    it('should end cheat mode if cheat mode is not on', () => {
        spyOn(service, 'endCheatMode');
        service.isCheatModeOn = false;
        service.cheatMode();
        expect(service.endCheatMode).toHaveBeenCalled();
    });

    it('should emit sendCheatEnd event if cheat mode is not on and replay is not set', () => {
        spyOn((service as any).normalComponent.sendCheatEnd, 'emit');
        service.isCheatModeOn = false;
        (service as any).replay = false;
        service.cheatMode();
        expect((service as any).normalComponent.sendCheatEnd.emit).toHaveBeenCalled();
    });

    it('should start cheat mode if cheat mode is on', () => {
        spyOn(service, 'startCheatMode').and.stub();
        service.isCheatModeOn = true;
        service.cheatMode();
        expect(service.startCheatMode).toHaveBeenCalled();
    });

    it('should clear interval and update contexts', () => {
        const clearIntervalSpy = spyOn(window, 'clearInterval');
        const updateContextsSpy = spyOn(service as any, 'updateContexts').and.stub();
        service.endCheatMode();
        expect(clearIntervalSpy).toHaveBeenCalledWith((service as any).cheatInterval);
        expect(updateContextsSpy).toHaveBeenCalled();
    });

    it('cheatInterval should show the cheat mode', (done) => {
        (service as any).replay = true;
        const updateContextsSpy = spyOn(service as any, 'updateContexts').and.stub();
        const drawImageContext1Spy = spyOn((service as any).component.context1, 'drawImage').and.stub();
        const drawImageContext2Spy = spyOn((service as any).component.context2, 'drawImage').and.stub();
        service.startCheatMode();
        setTimeout(() => {
            expect(updateContextsSpy).toHaveBeenCalled();
            expect(drawImageContext1Spy).toHaveBeenCalled();
            expect(drawImageContext2Spy).toHaveBeenCalled();
            done();
            service.endCheatMode();
        }, Time.Thousand);
    });

    it('should set context1 and context2 to canvas contexts', () => {
        const context = document.createElement('canvas').getContext('2d');
        spyOn((service as any).component.canvas1.nativeElement, 'getContext').and.returnValue(context);
        spyOn((service as any).component.canvas2.nativeElement, 'getContext').and.returnValue(context);
        service.setContexts();
        expect(component.context1).toBe(context as CanvasRenderingContext2D);
        expect(component.context2).toBe(context as CanvasRenderingContext2D);
    });

    it('should not set context1 and context2 if canvas contexts are null', () => {
        spyOn(service, 'endCheatMode').and.stub();
        (service as any).component.context1 = null;
        (service as any).component.context2 = null;
        spyOn((service as any).component.canvas1.nativeElement, 'getContext').and.returnValue(null);
        spyOn((service as any).component.canvas2.nativeElement, 'getContext').and.returnValue(null);
        service.setContexts();
        expect((service as any).component.context1).toBeNull();
        expect((service as any).component.context2).toBeNull();
    });

    it('should not flash difference if one of the context is null', () => {
        spyOn(service, 'endCheatMode').and.stub();
        const matrix = [
            [1, 2, 3],
            [2, 1, 0],
        ];
        (service as any).component.context1 = null;
        (service as any).replay = true;
        const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
        service.flashDifference(matrix, 'Test');
        expect(clearIntervalSpy).not.toHaveBeenCalled();
    });

    it('should flash difference in play mode', (done) => {
        const matrix = [
            [1, 2, 3],
            [2, 1, 0],
        ];
        (service as any).replay = false;
        const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
        const removeDifferenceSpy = spyOn(service as any, 'removeDifference').and.stub();
        service.flashDifference(matrix, 'Test');
        setTimeout(() => {
            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(removeDifferenceSpy).toHaveBeenCalled();
            done();
        }, Time.Thousand);
    });

    it('should show "ERREUR" on the canvas1', () => {
        (service as any).replay = false;
        const updateContextsSpy = spyOn(service as any, 'updateContexts').and.stub();
        const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
        const canvas = document.createElement('canvas');
        (service as any).component.canvas1 = new ElementRef(canvas);
        service.errorAnswerVisuals(canvas, { x: 0, y: 0 });
        expect(updateContextsSpy).toHaveBeenCalled();
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should show "ERREUR" on the canvas2', () => {
        (service as any).replay = false;
        const updateContextsSpy = spyOn(service as any, 'updateContexts').and.stub();
        const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
        const canvas = document.createElement('canvas');
        (service as any).component.canvas2 = new ElementRef(canvas);
        service.errorAnswerVisuals(canvas, { x: 0, y: 0 });
        expect(updateContextsSpy).toHaveBeenCalled();
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should create and fill a new layer of the canvas', () => {
        const matrix = [
            [1, 2, 3],
            [2, 1, 0],
        ];
        const layer = service.createAndFillNewLayer(Color.Luigi, false, false, matrix);
        expect(layer.getContext('2d')?.globalAlpha).toEqual(1);
    });

    it('should handle the image load', () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const image = new Image();
        if (context) {
            const drawImageSpy = spyOn(context, 'drawImage').and.stub();
            service.handleImageLoad(context, image);
            expect(drawImageSpy).toHaveBeenCalled();
        }
    });

    it('should flash the difference', () => {
        const matrix = [
            [1, 2, 3],
            [2, 1, 0],
        ];
        const flashDifferenceSpy = spyOn(service as any, 'flashDifference').and.stub();
        service.correctAnswerVisuals(matrix, 'Test');
        expect(flashDifferenceSpy).toHaveBeenCalled();
    });

    it('should update the cheat speed if replayCheatOn is true', () => {
        (service as any).replayCheatOn = true;
        const startCheatModeSpy = spyOn(service as any, 'startCheatMode').and.stub();
        const endCheatModeSpy = spyOn(service as any, 'endCheatMode').and.stub();
        service.updateCheatSpeed();
        expect(startCheatModeSpy).toHaveBeenCalled();
        expect(endCheatModeSpy).toHaveBeenCalled();
    });

    it('should not update the cheat speed if replayCheatOn is false', () => {
        (service as any).replayCheatOn = false;
        const startCheatModeSpy = spyOn(service as any, 'startCheatMode').and.stub();
        const endCheatModeSpy = spyOn(service as any, 'endCheatMode').and.stub();
        service.updateCheatSpeed();
        expect(startCheatModeSpy).not.toHaveBeenCalled();
        expect(endCheatModeSpy).not.toHaveBeenCalled();
    });

    it('should call drawImage with layer only on the left and have expected behavior', (done) => {
        const layer = document.createElement('canvas');
        const spyTimeout = spyOn(window, 'clearTimeout');
        const spyInterval = spyOn(window, 'clearInterval');
        const spyCtx1 = spyOn((service as any).component.context1, 'drawImage').and.callThrough();
        const spyUpdateCtx = spyOn(service as any, 'updateContexts');
        spyOn(service, 'saveGameState').and.stub();
        (service as any).hintTimeout = 0;
        (service as any).playNormalHint(layer, true);
        setTimeout(() => {
            expect(spyTimeout).toHaveBeenCalled();
            expect(spyInterval).toHaveBeenCalledWith((service as any).hintInterval);
            expect(spyInterval).toHaveBeenCalled();
            expect(spyCtx1).toHaveBeenCalledWith(layer, 0, 0, Dimensions.DefaultWidth, Dimensions.DefaultHeight);
            expect(spyUpdateCtx).toHaveBeenCalled();
            expect(spyUpdateCtx).toHaveBeenCalledTimes(Time.Thousand / Time.OneHundredTwentyFive + 1);
            done();
        }, Time.Thousand * 2);
    });

    it('should call drawImage with layer only on the right and have expected behavior', (done) => {
        const layer = document.createElement('canvas');
        const spyTimeout = spyOn(window, 'clearTimeout');
        const spyInterval = spyOn(window, 'clearInterval');
        const spyCtx2 = spyOn((service as any).component.context2, 'drawImage').and.callThrough();
        const spyUpdateCtx = spyOn(service as any, 'updateContexts');
        spyOn(service, 'saveGameState').and.stub();
        (service as any).hintTimeout = 0;
        (service as any).playNormalHint(layer, false);
        setTimeout(() => {
            expect(spyTimeout).toHaveBeenCalled();
            expect(spyInterval).toHaveBeenCalledWith((service as any).hintInterval);
            expect(spyInterval).toHaveBeenCalled();
            expect(spyCtx2).toHaveBeenCalledWith(layer, 0, 0, Dimensions.DefaultWidth, Dimensions.DefaultHeight);
            expect(spyUpdateCtx).toHaveBeenCalled();
            expect(spyUpdateCtx).toHaveBeenCalledTimes(Time.Thousand / Time.OneHundredTwentyFive + 1);
            done();
        }, Time.Thousand * 2);
    });

    it('remove difference should update the differenceMatrix', () => {
        const spy = spyOn((service as any).normalComponent, 'verifyDifferenceMatrix');
        const newDiffMatrix = [
            [PossibleColor.EMPTYPIXEL, PossibleColor.EMPTYPIXEL, PossibleColor.EMPTYPIXEL],
            [PossibleColor.EMPTYPIXEL, PossibleColor.EMPTYPIXEL, PossibleColor.EMPTYPIXEL],
            [PossibleColor.EMPTYPIXEL, PossibleColor.EMPTYPIXEL, PossibleColor.EMPTYPIXEL],
        ];
        (service as any).normalComponent.differenceMatrix = newDiffMatrix;
        (service as any).normalComponent.differenceMatrix[0][0] = PossibleColor.WHITE;
        (service as any).normalComponent.differenceMatrix[1][2] = PossibleColor.BLACK;
        (service as any).removeDifference((service as any).normalComponent.differenceMatrix);
        expect((service as any).normalComponent.differenceMatrix).toEqual(newDiffMatrix);
        expect(spy).toHaveBeenCalledOnceWith('cheat');
    });

    it('remove difference should emit sendSource event', () => {
        const matrix = [[]];
        const image = new Image();
        image.src = 'source';
        const layer = document.createElement('canvas');
        (service as any).component.original = image;
        (service as any).component.cheatLayer = layer;
        (service as any).normalComponent.differenceMatrix = matrix;
        (service as any).removeDifference((service as any).normalComponent.differenceMatrix);
    });

    it('updateContexts should draw initials images on canvas', () => {
        const spy1 = spyOn((service as any).component.context1, 'drawImage');
        const spy2 = spyOn((service as any).component.context2, 'drawImage');
        (service as any).updateContexts();
        expect(spy1).toHaveBeenCalledOnceWith((service as any).component.original, 0, 0, Dimensions.DefaultWidth, Dimensions.DefaultHeight);
        expect(spy2).toHaveBeenCalledOnceWith((service as any).component.modified, 0, 0, Dimensions.DefaultWidth, Dimensions.DefaultHeight);
    });
});
