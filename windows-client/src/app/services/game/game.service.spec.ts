/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { ChatService } from '@app/services/chat/chat.service';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { GameService } from '@app/services/game/game.service';
import { BestTime } from '@common/classes/best-time';
import { GameConstants } from '@common/classes/game-constants';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

class ChatServiceMock extends ChatService {
    override handleMessage() {
        return;
    }
}

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

describe('GameService', () => {
    let differenceMatrix: number[][];
    let gameData: GameData;
    let gameRoom: GameRoom;
    let differenceTry: DifferenceTry;
    let newBestTimes: BestTime[];

    let service: GameService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationHttpService>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let chatServiceMock: ChatServiceMock;
    let configHttpServiceSpy: jasmine.SpyObj<ConfigHttpService>;

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
        gameRoom = {
            userGame: {
                gameName: '',
                chosenDifference: -1,
                potentialPlayers: [],
                differenceFoundByPlayers: [],
                nbDifferenceFound: 0,
                timer: 0,
                creator: 'Test',
                currentPlayers: [
                    { username: 'Test', isAndroid: false },
                    { username: 'Test2', isAndroid: false },
                ],
            },
            roomId: 'fakeId',
            started: false,
            gameMode: 'mode Classique',
            gameConstants: undefined as unknown as GameConstants,
        };
        differenceTry = {
            validated: true,
            differencePos: { x: 0, y: 0 },
            username: 'Test',
            everyoneScore: [{ username: 'Test', differencesFound: 1 }],
        };
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        chatServiceMock = new ChatServiceMock(socketServiceMock);
        configHttpServiceSpy = jasmine.createSpyObj('ConfigHttpService', ['getConstants', 'getBestTime', 'updateBestTime']);
        configHttpServiceSpy.getBestTime.and.returnValue(of({ soloBestTimes: newBestTimes, vsBestTimes: newBestTimes }));
        configHttpServiceSpy.getConstants.and.returnValue(of({ gameDuration: 10, bonusTime: 10, penaltyTime: 10, cheatMode: false }));
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getAllGames', 'getGame']);
        communicationServiceSpy.getAllGames.and.returnValue(of([gameData]));
        communicationServiceSpy.getGame.and.returnValue(of(gameData));
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, DynamicTestModule, RouterTestingModule],
            providers: [
                ChatService,
                CommunicationSocketService,
                CommunicationHttpService,
                ConfigHttpService,
                { provide: CommunicationHttpService, useValue: communicationServiceSpy },
                { provide: CommunicationSocketService, useValue: socketServiceMock },
                { provide: ChatService, useValue: chatServiceMock },
                { provide: ConfigHttpService, useValue: configHttpServiceSpy },
            ],
        });
        service = TestBed.inject(GameService);
        service.gameRoom = gameRoom;
        (service as any).handleSocket();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call send message from chatService', () => {
        const sendMessageSpy = spyOn(chatServiceMock, 'sendMessage').and.stub();
        service.sendMessage('hello there', 'test');
        expect(sendMessageSpy).toHaveBeenCalledWith('hello there', 'test', gameRoom.roomId);
    });

    it('should return true when gameMode is limited time', () => {
        service.gameMode = 'mode Temps Limité';
        expect(service.isLimitedTimeMode()).toBeTrue();
    });

    it('should call getIsTyping from chatService', () => {
        const getIsTypingSpy = spyOn(chatServiceMock, 'getIsTyping').and.stub();
        service.getIsTyping();
        expect(getIsTypingSpy).toHaveBeenCalled();
    });

    it('startGame should assign values', () => {
        const handleMessageSpy = spyOn(chatServiceMock, 'handleMessage').and.stub();
        const handleSocketSpy = spyOn(service as any, 'handleSocket').and.stub();
        service.startGame(gameRoom, 'test');
        expect(service.gameRoom).toEqual(gameRoom);
        expect(service.username).toEqual('test');
        expect(service.gameMode).toEqual('mode Classique');
        expect(handleMessageSpy).toHaveBeenCalled();
        expect(handleSocketSpy).toHaveBeenCalled();
    });

    it('connect socket and send start should only called by gameCreator in startGame', () => {
        const handleMessageSpy = spyOn(chatServiceMock, 'handleMessage').and.stub();
        const handleSocketSpy = spyOn(service as any, 'handleSocket').and.stub();
        const startGameSpy = spyOn(socketServiceMock, 'send').and.stub();
        service.startGame(gameRoom, gameRoom.userGame.currentPlayers[0].username);
        expect(service.gameRoom).toEqual(gameRoom);
        expect(service.username).toEqual(gameRoom.userGame.currentPlayers[0].username);
        expect(service.gameMode).toEqual('mode Classique');
        expect(handleMessageSpy).toHaveBeenCalled();
        expect(handleSocketSpy).toHaveBeenCalled();
        expect(startGameSpy).toHaveBeenCalledWith('start', gameRoom.roomId);
    });

    it('getAllGames and gameDeletedSocket should be called only in limited time mode in startGame', () => {
        const handleMessageSpy = spyOn(chatServiceMock, 'handleMessage').and.stub();
        const handleSocketSpy = spyOn(service as any, 'handleSocket').and.stub();
        gameRoom.gameMode = 'mode Temps Limité';
        const gameDeletedSocketSpy = spyOn(service, 'gameDeletedSocket').and.stub();
        service.startGame(gameRoom, 'test');
        expect(service.gameRoom).toEqual(gameRoom);
        expect(service.username).toEqual('test');
        expect(service.gameMode).toEqual('mode Temps Limité');
        expect(handleMessageSpy).toHaveBeenCalled();
        expect(handleSocketSpy).toHaveBeenCalled();
        expect(gameDeletedSocketSpy).toHaveBeenCalled();
    });

    it('turnOffWaitingSocket should call off by socket', () => {
        const offSpy = spyOn(socketServiceMock, 'off').and.stub();
        service.turnOffWaitingSocket();
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(offSpy).toHaveBeenCalledTimes(5);
    });

    it('getAllGames should call getAllGames by communication service', () => {
        service.getAllGames();
        expect(communicationServiceSpy.getAllGames).toHaveBeenCalled();
    });

    it('should handle gameDeletedSocket', () => {
        service.slides = [gameData];
        service.gameDeletedSocket();
        socketHelper.peerSideEmit('gameCanceled', gameRoom.userGame.gameName);
        expect(service.slides).toEqual([]);
    });

    it('should abort the game creation', () => {
        const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = gameRoom;
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.abortGame();
        expect(sendSpy).toHaveBeenCalledWith('abortGameCreation', service.gameRoom.roomId);
    });

    it('should leave game', () => {
        const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = gameRoom;
        service.username = 'differentUsername';
        service.abortGame();
        expect(sendSpy).toHaveBeenCalledWith('leaveGame', { roomId: service.gameRoom.roomId, username: service.username });
    });

    it('should validate the difference', () => {
        const spy = spyOn(socketServiceMock, 'send').and.stub();
        service.gameRoom = gameRoom;
        service.username = 'test';
        service.sendServerValidate({ x: 0, y: 0 });
        expect((service as any).canSendValidate).toBeFalsy();
        expect(spy).toHaveBeenCalledWith('validate', { roomId: gameRoom.roomId, differencePos: { x: 0, y: 0 }, username: 'test' });
    });

    it('should not validate the difference', () => {
        (service as any).canSendValidate = false;
        const spy = spyOn(socketServiceMock, 'send').and.stub();
        service.sendServerValidate({ x: 0, y: 0 });
        expect((service as any).canSendValidate).toBeFalsy();
        expect(spy).not.toHaveBeenCalled();
    });

    // it('should end the game and update constants if its a new best time', () => {
    //     const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
    //     const socketAliveSpy = spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
    //     const getBestTimeSpy = configHttpServiceSpy.getBestTime.and.returnValue(of({ soloBestTimes: newBestTimes, vsBestTimes: newBestTimes }));
    //     const updateBestTimeSpy = configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     spyOn(service as any, 'updateBestTime').and.callThrough();
    //     service.gameRoom = gameRoom;
    //     service.gameRoom.userGame.timer = 1;
    //     service.gameMode = 'mode Classique';
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(socketAliveSpy).toHaveBeenCalled();
    //     expect(getBestTimeSpy).toHaveBeenCalled();
    //     // expect(updateBestTimeSpy).toHaveBeenCalled();
    //     // expect(service.timePosition$).toBeTruthy();
    //     // expect(updateBestTimeSpy).toHaveBeenCalled();
    // });

    // it('should end the game and not update constants if game mode is limited time', () => {
    //     const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
    //     const socketAliveSpy = spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
    //     const updateBestTimeSpy = spyOn(service as any, 'updateBestTime').and.callThrough();
    //     service.gameRoom = gameRoom;
    //     service.gameMode = 'mode Temps Limité';
    //     service.gameRoom.userGame.timer = 1;
    //     expect(sendSpy).toHaveBeenCalled();
    //     expect(socketAliveSpy).toHaveBeenCalled();
    //     expect(updateBestTimeSpy).not.toHaveBeenCalled();
    // });

    it('changeTime should send a socket', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
        service.gameRoom = gameRoom;
        service.changeTime(1);
        expect(sendSpy).toHaveBeenCalledWith('changeTime', { roomId: gameRoom.roomId, time: 1 });
    });

    it('should reset', () => {
        service.gameRoom = gameRoom;
        service.reset();
        expect(service.gameRoom).toBeUndefined();
        expect((service as any).canSendValidate).toBeTruthy();
        expect(service.username).toEqual('');
    });

    it('abandonGame should send a socket', () => {
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
        service.username = 'Test';
        service.gameRoom = gameRoom;
        service.abandonGame();
        expect(sendSpy).toHaveBeenCalledWith('abandoned', { roomId: gameRoom.roomId, username: 'Test' });
    });

    it('next game should change to next slide', () => {
        const sendSpy = spyOn(socketServiceMock, 'send').and.stub();
        gameData.name = 'nextGame';
        service.gameRoom = gameRoom;
        service.username = gameRoom.userGame.creator;
        service.slides = [gameData];
        service.loadNextGame();
        expect(sendSpy).toHaveBeenCalledWith('nextGame', service.gameRoom);
        expect(service.gameRoom.userGame.gameName).toEqual('nextGame');
    });

    // it('next game should finish game if there is no more slides', () => {
    //     const gameFinishedSpy = spyOn(service.gameFinished$, 'next');
    //     service.slides = [];
    //     service.loadNextGame();
    //     expect(gameFinishedSpy).toHaveBeenCalledWith(undefined);
    // });

    it('should handle on started message', () => {
        service.gameRoom = gameRoom;
        service.gameRoom.roomId = '';
        socketHelper.peerSideEmit('started', gameRoom);
        expect(service.gameRoom.roomId).toEqual(gameRoom.roomId);
    });

    it('should handle on validated message', () => {
        service.gameRoom = gameRoom;
        socketHelper.peerSideEmit('validated', differenceTry);
        expect(service.gameRoom.userGame.nbDifferenceFound).toEqual(1);
        expect(service.serverValidateResponse$).toBeTruthy();
    });

    it('should increment userDifferenceFound if validated and are the same user', () => {
        service.gameRoom = gameRoom;
        service.username = differenceTry.username;
        socketHelper.peerSideEmit('validated', differenceTry);
        expect(service.gameRoom.userGame.nbDifferenceFound).toEqual(1);
        expect(service.serverValidateResponse$).toBeTruthy();
    });

    it('should handle on GameFinished message', () => {
        service.gameRoom = gameRoom;
        socketHelper.peerSideEmit('GameFinished');
        expect(service.gameFinished$).toBeTruthy();
    });

    it('should handle abandoned', () => {
        socketHelper.peerSideEmit('abandoned', { gameRoom, username: 'Test' });
        expect(service.abandoned$).toBeTruthy();
    });

    it('should handle abandoned and call limitedTimeGameAbandoned in limited time mode ', () => {
        const limitedTimeGameAbandonedSpy = spyOn(service as any, 'limitedTimeGameAbandoned').and.stub();
        service.gameMode = 'mode Temps Limité';
        socketHelper.peerSideEmit('abandoned', { gameRoom, username: 'Test' });
        expect(service.abandoned$).toBeTruthy();
        expect(limitedTimeGameAbandonedSpy).toHaveBeenCalledWith(gameRoom);
    });

    it('should handle on timer message', () => {
        service.gameRoom = gameRoom;
        socketHelper.peerSideEmit('timer', 1);
        expect(service.gameRoom.userGame.timer).toEqual(1);
    });

    it('should handle on timer message and end game if time < 0', () => {
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Temps Limité';
        service.gameRoom.userGame.timer = -1;
        socketHelper.peerSideEmit('timer', 1);
        expect(service.gameRoom.userGame.timer).toEqual(1);
        expect(service.gameFinished$).toBeTruthy();
    });

    it('should set GameRoom', () => {
        service.gameRoom = undefined as unknown as GameRoom;
        (service as any).limitedTimeGameAbandoned(gameRoom);
        expect(service.gameRoom).toEqual(gameRoom);
    });

    // it('should update the best time if game finished and winner', () => {
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     service.gameRoom = gameRoom;
    //     service.username = 'Test User';
    //     spyOn(service.timePosition$, 'next');
    //     service.gameRoom.userGame.timer = 1;
    //     (service as any).updateBestTime(true, true);
    //     expect(configHttpServiceSpy.updateBestTime).toHaveBeenCalled();
    //     expect(service.timePosition$.next).toHaveBeenCalledWith(0);
    // });

    // it('should not update the best time if game finished but not a winner', () => {
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     service.gameRoom = gameRoom;
    //     service.username = 'Test User';
    //     service.gameRoom.userGame.timer = 1;
    //     (service as any).updateBestTime(true, false);
    //     expect(configHttpServiceSpy.updateBestTime).not.toHaveBeenCalled();
    // });

    // it('should not update the best time if game did not finished', () => {
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     service.gameRoom = gameRoom;
    //     service.username = 'Test User';
    //     service.gameRoom.userGame.timer = 1;
    //     (service as any).updateBestTime(false, false);
    //     expect(configHttpServiceSpy.updateBestTime).not.toHaveBeenCalled();
    // });

    // it('should not update the best time if user abandoned', () => {
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     service.gameRoom = gameRoom;
    //     service.username = 'Test User';
    //     service.gameRoom.userGame.timer = 1;
    //     (service as any).updateBestTime(false, false);
    //     expect(configHttpServiceSpy.updateBestTime).not.toHaveBeenCalled();
    // // });

    // it('should use vsBestTime in case of multiplayer', () => {
    //     // user can only defeat vsBestTimes
    //     const fakeBestTime = [
    //         { name: 'Player 1', time: 1000 },
    //         { name: 'Player 2', time: 1200 },
    //         { name: 'Player 3', time: 1800 },
    //     ];
    //     configHttpServiceSpy.getBestTime.and.returnValue(of({ soloBestTimes: newBestTimes, vsBestTimes: fakeBestTime }));
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     spyOn(service.timePosition$, 'next');
    //     service.gameRoom = gameRoom;
    //     service.gameRoom.userGame.currentPlayers[1] = 'hello';
    //     service.gameRoom.userGame.timer = 200;
    //     service.username = 'Test User';
    //     const newBestTime = new NewBestTime();
    //     newBestTime.gameName = gameRoom.userGame.gameData.name;
    //     newBestTime.time = 200;
    //     newBestTime.name = 'Test User';
    //     newBestTime.isSolo = false;
    //     (service as any).updateBestTime(true, true);
    //     expect(configHttpServiceSpy.updateBestTime).toHaveBeenCalledWith(gameRoom.userGame.gameData.name, newBestTime);
    //     expect(service.timePosition$.next).toHaveBeenCalledWith(0);
    // });

    // it('should not call timePosition$ when server return -1', () => {
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(-1));
    //     spyOn(service.timePosition$, 'next');
    //     service.gameRoom = gameRoom;
    //     service.gameRoom.userGame.timer = 1;
    //     service.username = 'Test User';
    //     (service as any).updateBestTime(true, true);
    //     expect(configHttpServiceSpy.updateBestTime).toHaveBeenCalled();
    //     expect(service.timePosition$.next).not.toHaveBeenCalled();
    // });

    // it('should not update the best time if getBestTime return undefined', () => {
    //     configHttpServiceSpy.getBestTime.and.returnValue(of(undefined as any));
    //     configHttpServiceSpy.updateBestTime.and.returnValue(of(0));
    //     service.gameRoom = gameRoom;
    //     service.username = 'Test User';
    //     service.gameRoom.userGame.timer = 1;
    //     (service as any).updateBestTime(false, false);
    //     expect(configHttpServiceSpy.updateBestTime).not.toHaveBeenCalled();
    // });
});
