/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
// eslint-disable-next-line max-classes-per-file
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatToolbar } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { EndgameDialogComponent } from '@app/components/endgame-dialog/endgame-dialog.component';
import { GameScoreboardComponent } from '@app/components/game-scoreboard/game-scoreboard.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { EndGame } from '@app/interfaces/game';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { PlayAreaService } from '@app/services/play-area/play-area.service';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { of, Subject } from 'rxjs';
import { Socket } from 'socket.io-client';

@NgModule({
    imports: [MatDialogModule, HttpClientModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}
class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('GamePageComponent', () => {
    let differenceMatrix: number[][];
    let gameData: GameData;
    let gameRoom: GameRoom;

    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let playAreaService: jasmine.SpyObj<PlayAreaService>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    const mockDialogRef = {
        afterClosed: () => of(true),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        close: () => {},
    };

    beforeEach(async () => {
        differenceMatrix = [[]];
        gameData = {
            name: '',
            creator: '',
            wantShoutout: false,
            nbDifference: 0,
            image1url: '',
            image2url: '',
            difficulty: '',
            soloBestTimes: [],
            vsBestTimes: [],
            differenceMatrix,
            differenceHashMap: [],
        };
        gameRoom = {
            userGame: {
                gameName: '',
                chosenDifference: -1,
                nbDifferenceFound: 0,
                timer: 0,
                creator: 'Test',
                currentPlayers: [{ username: 'Test', isAndroid: true }],
                differenceFoundByPlayers: [],
            },
            roomId: 'fakeId',
            started: false,
            gameMode: 'mode Classique',
            gameConstants: { gameDuration: 10, penaltyTime: 10, bonusTime: 0, cheatMode: false },
        };
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
        gameServiceSpy.hint$ = new Subject<{ imageData: string; left: boolean }>();
        gameServiceSpy.serverValidateResponse$ = new Subject<DifferenceTry>();
        gameServiceSpy.cheatModeResponse$ = new Subject<boolean>();
        gameServiceSpy.gameConstants = { gameDuration: 10, penaltyTime: 10, bonusTime: 0, cheatMode: false };
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        spyOn(socketServiceMock, 'off').and.stub();
        playAreaService = jasmine.createSpyObj('PlayAreaService', [
            'cheatMode',
            'flashDifference',
            'errorAnswerVisuals',
            'createAndFillNewLayer',
            'handleImageLoad',
            'setContexts',
            'setComponent',
            'setSpeed',
            'setCheatMode',
            'correctAnswerVisuals',
            'clearAsync',
            'hintMode',
            'startConfetti',
            'endCheatMode',
        ]);
        gameServiceSpy.gameRoom = gameRoom;
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent, GameScoreboardComponent, MatToolbar, EndgameDialogComponent, ChatBoxComponent, PlayAreaComponent],
            imports: [DynamicTestModule, RouterTestingModule, MatDialogModule, HttpClientTestingModule],
            providers: [
                { provide: PlayAreaService, useValue: playAreaService },
                { provide: CommunicationSocketService, useValue: socketServiceMock },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        component.gameRoom = gameRoom;
        component.gameData = gameData;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should contain a scoreboard', () => {
        fixture.detectChanges();
        const sidebar = fixture.debugElement.nativeElement.querySelector('app-game-scoreboard');
        expect(sidebar).not.toBeNull();
    });

    it('should subscribe to timer$ observable', () => {
        const testingValue = 5;
        const spyTimer = spyOn(gameServiceSpy.timer$, 'subscribe').and.callThrough();
        component.ngOnInit();
        gameServiceSpy.timer$.next(testingValue);
        expect(spyTimer).toHaveBeenCalled();
        expect(component.timer).toEqual(testingValue);
    });

    it('should subscribe to totalDifferencesFound $ observable', () => {
        const testingValue = 5;
        const spyDifferencesFound = spyOn(gameServiceSpy.totalDifferencesFound$, 'subscribe').and.callThrough();
        component.ngOnInit();
        gameServiceSpy.totalDifferencesFound$.next(testingValue);
        expect(spyDifferencesFound).toHaveBeenCalled();
        expect(component.totalDifferencesFound).toEqual(testingValue);
    });

    it('should subscribe to userDifferencesFound$ observable', () => {
        const testingValue = 5;
        component.gameRoom.userGame.currentPlayers[1] = { username: 'user2', isAndroid: false };
        gameServiceSpy.gameMode = 'mode Classique';
        (component as any).differenceThreshold = 5;
        const spyDifferencesFound = spyOn(gameServiceSpy.userDifferencesFound$, 'subscribe').and.callThrough();
        component.ngOnInit();
        gameServiceSpy.userDifferencesFound$.next(testingValue);
        expect(spyDifferencesFound).toHaveBeenCalled();
        expect(component.userDifferencesFound).toEqual(testingValue);
        expect(gameServiceSpy.gameFinished$).toBeTruthy();
    });

    it('should subscribe to gameRoom$ observable', () => {
        const spyUserGame = spyOn(gameServiceSpy.gameRoom$, 'subscribe').and.callThrough();
        component.ngOnInit();
        gameServiceSpy.gameRoom$.next(gameRoom);
        expect(spyUserGame).toHaveBeenCalled();
        expect(component.gameRoom).toEqual(gameRoom);
        expect(component.gameName).toEqual(gameRoom.userGame.gameName);
        expect(component.username).toEqual(gameServiceSpy.username);
    });

    it('should subscribe to gameRoom$ observable and assign opponent username to username2', () => {
        gameServiceSpy.username = gameRoom.userGame.currentPlayers[0].username;
        gameRoom.userGame.currentPlayers[1] = { username: 'user2', isAndroid: false };
        const spyUserGame = spyOn(gameServiceSpy.gameRoom$, 'subscribe').and.callThrough();
        component.ngOnInit();
        gameServiceSpy.gameRoom$.next(gameRoom);
        expect(spyUserGame).toHaveBeenCalled();
        expect(component.gameRoom).toEqual(gameRoom);
        expect(component.gameName).toEqual(gameRoom.userGame.gameName);
        expect(component.username).toEqual(gameServiceSpy.username);
    });

    it('should subscribe to abandoned$ observable', () => {
        const spyAbandonGame = spyOn(gameServiceSpy.abandoned$, 'subscribe').and.callThrough();
        component.ngOnInit();
        gameServiceSpy.abandoned$.next('test');
        expect(spyAbandonGame).toHaveBeenCalled();
    });

    it('should call getConstants and getConstantsFromServer', () => {
        gameServiceSpy.getConstant.and.stub();
        component.ngOnInit();
        expect(gameServiceSpy.getConstant).toHaveBeenCalled();
        expect(component.penaltyTime).toEqual(10);
    });

    it('should open EndgameDialogComponent and abandon game if abandon is true', fakeAsync(() => {
        spyOn((component as any).dialog, 'open').and.returnValue(mockDialogRef as MatDialogRef<EndgameDialogComponent>);
        spyOn((component as any).router, 'navigate');
        gameServiceSpy.abandonGame.and.stub();
        (component as any).abandonConfirmation();
        flush();
        expect((component as any).dialog.open).toHaveBeenCalled();
        expect(gameServiceSpy.abandonGame).toHaveBeenCalled();
        expect((component as any).router.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should unsubscribe from all subscriptions on unsubscribe', () => {
        spyOn((component as any).timerSubscription, 'unsubscribe');
        spyOn((component as any).differencesFoundSubscription, 'unsubscribe');
        spyOn((component as any).userDifferencesFoundSubscription, 'unsubscribe');
        spyOn((component as any).gameFinishedSubscription, 'unsubscribe');
        spyOn((component as any).gameRoomSubscription, 'unsubscribe');
        spyOn((component as any).abandonedGameSubscription, 'unsubscribe');
        (component as any).unsubscribe();
        expect((component as any).timerSubscription.unsubscribe).toHaveBeenCalled();
        expect((component as any).differencesFoundSubscription.unsubscribe).toHaveBeenCalled();
        expect((component as any).userDifferencesFoundSubscription.unsubscribe).toHaveBeenCalled();
        expect((component as any).gameFinishedSubscription.unsubscribe).toHaveBeenCalled();
        expect((component as any).gameRoomSubscription.unsubscribe).toHaveBeenCalled();
        expect((component as any).abandonedGameSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should reset and clearAsync on ngOnDestroy', fakeAsync(() => {
        gameServiceSpy.reset.and.stub();
        playAreaService.clearAsync.and.stub();
        gameServiceSpy.abandonGame.and.stub();
        const closeAllSpy = spyOn((component as any).dialog, 'closeAll').and.stub();
        component.ngOnDestroy();
        flush();
        expect(closeAllSpy).toHaveBeenCalled();
        expect(gameServiceSpy.reset).toHaveBeenCalled();
        expect(playAreaService.clearAsync).toHaveBeenCalled();
    }));
});
