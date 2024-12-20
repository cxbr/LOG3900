/* eslint-disable max-lines */
/* eslint-disable max-classes-per-file */
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { Socket } from 'socket.io-client';
import { WaitingRoomService } from './waiting-room.service';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('WaitingRoomService', () => {
    let differenceMatrix: number[][];
    let gameData: GameData;
    let gameRoom: GameRoom;

    let service: WaitingRoomService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

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
            differenceHashMap: [],
        };
        gameRoom = {
            userGame: {
                gameName: '',
                chosenDifference: -1,
                differenceFoundByPlayers: [],
                nbDifferenceFound: 0,
                timer: 0,
                creator: 'Test',
                currentPlayers: [{ username: 'Test', isAndroid: false }],
            },
            roomId: 'fakeId',
            started: false,
            gameMode: 'mode Classique',
            gameConstants: { cheatMode: false, gameDuration: 0, penaltyTime: 0, bonusTime: 0 },
        };
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, AppRoutingModule, DynamicTestModule],
            providers: [{ provide: CommunicationSocketService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(WaitingRoomService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it("should send 'rejectPlayer' after calling 'playerRejected'", () => {
        spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = gameRoom;
        service.playerRejected('Test');
        expect(socketServiceMock.send).toHaveBeenCalledWith('rejectPlayer', { roomId: service.gameRoom.roomId, username: 'Test' });
    });

    it("should send 'acceptPlayer' after calling 'playerAccepted'", () => {
        spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = gameRoom;
        service.playerAccepted('Test', false);
        expect(socketServiceMock.send).toHaveBeenCalledWith('acceptPlayer', { roomId: service.gameRoom.roomId, username: 'Test', isAndroid: false });
    });

    it('should abort the game creation', () => {
        spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = gameRoom;
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.abortGame();
        expect(socketServiceMock.send).toHaveBeenCalledWith('abortGameCreation', service.gameRoom.roomId);
    });

    it('should leave game', () => {
        spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = gameRoom;
        service.username = 'differentUsername';
        service.abortGame();
        expect(socketServiceMock.send).toHaveBeenCalledWith('leaveGame', { roomId: service.gameRoom.roomId, username: service.username });
    });

    it('should leave game if gameRoom is undefined', () => {
        spyOn(socketServiceMock, 'send').and.stub();
        spyOn(socketServiceMock, 'isSocketAlive').and.returnValue(true);
        service.gameRoom = undefined as unknown as GameRoom;
        service.username = 'differentUsername';
        service.gameMode = 'mode Classique';
        service.abortGame();
        expect(socketServiceMock.send).not.toHaveBeenCalled();
    });

    it('should start game', () => {
        spyOn(socketServiceMock, 'send').and.stub();
        service.gameRoom = gameRoom;
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.startGame();
        expect(socketServiceMock.send).toHaveBeenCalled();
    });

    it('should create game', () => {
        spyOn(service, 'handleWaitingRoomSocket').and.stub();
        spyOn(socketServiceMock, 'send').and.stub();
        service.createGame(gameRoom);
        expect(service.gameRoom).toEqual(gameRoom);
        expect(service.username).toEqual(gameRoom.userGame.currentPlayers[0].username);
        expect(service.gameMode).toEqual(gameRoom.gameMode);
        expect(service.handleWaitingRoomSocket).toHaveBeenCalled();
        expect(socketServiceMock.send).toHaveBeenCalledWith('createGame', gameRoom);
    });

    it('should join game', () => {
        spyOn(service, 'handleWaitingRoomSocket').and.stub();
        spyOn(socketServiceMock, 'send').and.stub();
        service.joinGame('test', 'mode Classique', 'fakeId');
        expect(service.gameRoom).toBeUndefined();
        expect(service.username).toEqual('test');
        expect(service.gameMode).toEqual('mode Classique');
        expect(service.handleWaitingRoomSocket).toHaveBeenCalled();
        expect(socketServiceMock.send).toHaveBeenCalledWith('askingToJoinGame', {
            gameName: undefined,
            user: {
                username: 'test',
                isAndroid: false,
            },
            gameMode: 'mode Classique',
            roomId: 'fakeId',
        });
    });

    it('should handle gameInfo', () => {
        service.gameRoom = undefined as unknown as GameRoom;
        service.gameMode = 'mode Classique';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameInfo', gameRoom);
        expect(service.gameRoom).toEqual(gameRoom);
    });

    it('should update GameRoom in gameInfo if we have the same username', () => {
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Classique';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameInfo', gameRoom);
        expect(service.gameRoom).toEqual(gameRoom);
    });

    it('should alert in gameInfo if we have difficulty retrieving game information', () => {
        spyOn(service.dialog, 'open').and.stub();
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameInfo', undefined as unknown as GameRoom);
        expect(service.dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
            panelClass: 'custom-modal',
            data: { message: 'Nous avons eu un problème pour obtenir les informations de jeu du serveur' },
        });
    });

    it('should handle playerAccepted', () => {
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.gameRoom = gameRoom;
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('playerAccepted', gameRoom);
        expect(service.gameRoom).toEqual(gameRoom);
    });

    it('should handle playerRejected', () => {
        spyOn(service.rejected$, 'next').and.stub();
        service.username = 'differentUsername';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('playerRejected', gameRoom);
        expect(service.rejected$.next).toHaveBeenCalled();
    });

    it('should handle playerRejected if different players still in potentialPlayers', () => {
        spyOn(service.rejected$, 'next').and.stub();
        service.username = 'differentUsername';
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const gameRoom = {
            userGame: {
                currentPlayers: [],
                potentialPlayers: [{ username: 'myusername', isAndroid: false }],
            },
        };
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('playerRejected', gameRoom);
        expect(service.rejected$.next).toHaveBeenCalled();
    });

    it("should handle playerRejected if requirements aren't met", () => {
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('playerRejected', gameRoom);
        expect(service.gameRoom).toEqual(gameRoom);
    });

    it('should handle gameCanceled', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Classique';
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameCanceled', gameRoom);
        expect(service.gameCanceled$.next).toHaveBeenCalled();
    });

    it('should handle gameCanceled if gameRoom is undefined', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        service.gameRoom = undefined as unknown as GameRoom;
        service.gameMode = 'mode Classique';
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameCanceled', gameRoom);
        expect(service.gameCanceled$.next).not.toHaveBeenCalled();
    });

    it('should handle gameCanceled send undefined', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Classique';
        service.username = gameRoom.userGame.currentPlayers[0].username;
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameCanceled', undefined as unknown as GameRoom);
        expect(service.gameCanceled$.next).not.toHaveBeenCalled();
    });

    it('should handle gameCanceled for potential users', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        gameRoom.userGame.potentialPlayers = [
            { username: 'myusername', isAndroid: false },
            { username: 'differentUsername', isAndroid: false },
        ];
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Classique';
        service.username = 'differentUsername';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameCanceled', gameRoom);
        expect(service.gameCanceled$.next).toHaveBeenCalled();
    });

    it('should handle gameCanceled if it was sent to wrong user', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Classique';
        service.username = 'differentUsername';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameCanceled', gameRoom);
        expect(service.gameCanceled$.next).not.toHaveBeenCalled();
    });

    it('should handle gameDeleted if it was sent to classic mode', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        service.gameRoom = gameRoom;
        service.gameMode = 'mode Classique';
        service.username = 'differentUsername';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameDeleted', gameRoom.userGame.gameName);
        expect(service.gameCanceled$.next).toHaveBeenCalled();
    });

    it('should handle gameDeleted if it was sent to limited time mode and there is no more games', () => {
        spyOn(service.gameCanceled$, 'next').and.stub();
        service.gameRoom = gameRoom;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).gameService.slides = [gameData];
        service.gameMode = 'mode Temps Limité';
        service.username = 'differentUsername';
        service.handleWaitingRoomSocket();
        socketHelper.peerSideEmit('gameDeleted', gameRoom.userGame.gameName);
        expect(service.gameCanceled$.next).toHaveBeenCalled();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((service as any).gameService.slides).toEqual([]);
    });
});
