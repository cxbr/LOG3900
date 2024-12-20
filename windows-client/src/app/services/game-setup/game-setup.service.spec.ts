/* eslint-disable max-classes-per-file */
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { WaitingRoomService } from '@app/services/waiting-room/waiting-room.service';
import { BestTime } from '@common/classes/best-time';
import { GameConstants } from '@common/classes/game-constants';
import { GameData } from '@common/classes/game-data';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GameSetupService } from './game-setup.service';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('GameSetupService', () => {
    let differenceMatrix: number[][];
    let gameData: GameData;
    let newBestTimes: BestTime[];

    let service: GameSetupService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationHttpService>;
    let configHttpServiceSpy: jasmine.SpyObj<ConfigHttpService>;
    let waitingRoomServiceSpy: jasmine.SpyObj<WaitingRoomService>;
    let zone: NgZone;

    beforeEach(() => {
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
            differenceHashMap: [{ number: 0, differenceMatrix }],
        };
        newBestTimes = [
            { name: 'Player 1', time: 60 },
            { name: 'Player 2', time: 120 },
            { name: 'Player 3', time: 180 },
        ];
        zone = new NgZone({ enableLongStackTrace: false });
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getAllGames', 'getGame']);
        communicationServiceSpy.getAllGames.and.returnValue(of([gameData]));
        communicationServiceSpy.getGame.and.returnValue(of(gameData));
        configHttpServiceSpy = jasmine.createSpyObj('ConfigHttpService', ['getConstants', 'getBestTime', 'updateBestTime']);
        configHttpServiceSpy.getConstants.and.returnValue(of({ gameDuration: 10, bonusTime: 2, penaltyTime: 0, cheatMode: false }));
        configHttpServiceSpy.getBestTime.and.returnValue(of({ soloBestTimes: newBestTimes, vsBestTimes: newBestTimes }));
        waitingRoomServiceSpy = jasmine.createSpyObj('WaitingRoomService', ['createGame', 'joinGame']);
        waitingRoomServiceSpy.createGame.and.stub();
        waitingRoomServiceSpy.joinGame.and.stub();
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, AppRoutingModule, DynamicTestModule],
            providers: [
                { provide: WaitingRoomService, useValue: waitingRoomServiceSpy },
                { provide: ConfigHttpService, useValue: configHttpServiceSpy },
                { provide: CommunicationHttpService, useValue: communicationServiceSpy },
                { provide: CommunicationSocketService, useValue: socketServiceMock },
            ],
        });
        service = TestBed.inject(GameSetupService);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).slides = [gameData];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should setConstants', () => {
        service.setConstants({ gameDuration: 10, bonusTime: 2, penaltyTime: 0, cheatMode: false });
        expect(service.gameConstants).toEqual({ gameDuration: 10, bonusTime: 2, penaltyTime: 0, cheatMode: false });
    });

    it('should getAllGames', () => {
        expect(communicationServiceSpy.getAllGames).toHaveBeenCalled();
        expect(service.getSlides()).toEqual([gameData]);
    });

    it('should getSlides', () => {
        expect(service.getSlides()).toEqual([gameData]);
    });

    it('should initGameRoom', () => {
        service.gameMode = 'mode Classique';
        localStorage.setItem(service.tokenKey, 'Player 1');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        spyOn(service as any, 'generateRandomId').and.returnValue('fakeId');
        service.initGameRoom(false);
        expect(service.gameRoom).toEqual({
            userGame: {
                gameName: undefined as unknown as string,
                chosenDifference: -1,
                nbDifferenceFound: 0,
                timer: 0,
                creator: 'Player 1',
                currentPlayers: [{ username: 'Player 1', isAndroid: false }],
                differenceFoundByPlayers: [{ username: 'Player 1', differencesFound: 0 }],
                observers: [],
            },
            roomId: 'fakeId',
            started: false,
            gameMode: 'mode Classique',
            gameConstants: undefined as unknown as GameConstants,
        });
        expect(service.username).toEqual('Player 1');
    });

    it('should call initClassicMode when gameMode is mode Classique', () => {
        spyOn(service, 'initClassicMode').and.stub();
        service.initGameMode('game1');
        expect(service.initClassicMode).toHaveBeenCalled();
    });

    it('should call initLimitedTimeMode when gameMode is mode Temps Limité', () => {
        spyOn(service, 'initLimitedTimeMode').and.stub();
        service.initGameMode();
        expect(service.initLimitedTimeMode).toHaveBeenCalled();
    });

    it('should initClassicMode', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).slides = [gameData];
        service.initGameRoom(false);
        service.initClassicMode('');
        expect(service.gameRoom.userGame.gameName).toEqual(gameData.name);
        expect(waitingRoomServiceSpy.createGame).toHaveBeenCalled();
    });

    it('should initClassicMode and call createGame by waiting room service', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).slides = [gameData];
        service.initGameRoom(true);
        zone.run(() => {
            service.initClassicMode('');
        });
        expect(service.gameRoom.userGame.gameName).toEqual(gameData.name);
        expect(waitingRoomServiceSpy.createGame).toHaveBeenCalled();
    });

    it('should alert if gameName is not found', () => {
        spyOn(service.dialog, 'open').and.stub();
        service.initClassicMode('game2');
        expect(service.dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
            panelClass: 'custom-modal',
            data: { message: 'Jeu introuvable' },
        });
    });

    it('should initLimitedTimeMode', () => {
        service.initGameRoom(false);
        service.initLimitedTimeMode();
        expect(service.gameRoom.userGame.gameName).toEqual(gameData.name);
        expect(waitingRoomServiceSpy.createGame).toHaveBeenCalled();
    });

    it('should initLimitedTimeMode and call createGame by waiting room service', () => {
        service.initGameRoom(true);
        zone.run(() => {
            service.initLimitedTimeMode();
        });
        expect(service.gameRoom.userGame.gameName).toEqual(gameData.name);
        expect(waitingRoomServiceSpy.createGame).toHaveBeenCalled();
    });

    it('should call joinClassicMode when gameMode is mode Classique', () => {
        spyOn(service, 'joinClassicMode').and.stub();
        service.gameMode = 'mode Classique';
        service.joinGame('username', 'gameName');
        expect(service.joinClassicMode).toHaveBeenCalled();
    });

    it('should call joinLimitedTimeMode when gameMode is mode Temps Limité', () => {
        spyOn(service, 'joinLimitedTimeMode').and.stub();
        service.gameMode = 'mode Temps Limité';
        service.joinGame('username', 'fakeId');
        expect(service.joinLimitedTimeMode).toHaveBeenCalled();
    });

    it('should joinClassicMode', () => {
        service.joinClassicMode('', 'fakeId');
        expect(waitingRoomServiceSpy.joinGame).toHaveBeenCalled();
    });

    it('should alert if gameName is not found', () => {
        spyOn(service.dialog, 'open').and.stub();
        service.joinClassicMode('game2', 'fakeId');
        expect(service.dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
            panelClass: 'custom-modal',
            data: { message: 'Jeu introuvable' },
        });
    });

    it('should joinLimitedTimeMode', () => {
        service.joinLimitedTimeMode('fakeId');
        expect(waitingRoomServiceSpy.joinGame).toHaveBeenCalled();
    });

    it('should return a randomSlide', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const randomSlide = (service as any).randomSlide();
        expect(randomSlide).toEqual(gameData);
    });

    it('should return a getGameData', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slide = (service as any).getGameData('');
        expect(slide).toEqual(gameData);
    });
});
