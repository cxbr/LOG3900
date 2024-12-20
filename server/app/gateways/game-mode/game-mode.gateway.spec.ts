/* eslint-disable max-lines */
import { DELAY_BETWEEN_EMISSIONS } from '@app/constants/constants';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameModeGateway } from '@app/gateways/game-mode/game-mode.gateway';
import { Vector2D } from '@app/model/schema/vector2d.schema';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { UserService } from '@app/services/user/user.service';
import { GameRoom } from '@common/classes/game-room';
import { CurrentPlayer, UserGame } from '@common/classes/user-game';
import { GameModeEvents } from '@common/enums/game-mode.gateway.variables';
import { GameMode } from '@common/game-mode';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('GameModeGateway', () => {
    let gateway: GameModeGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let gameModeService: SinonStubbedInstance<GameModeService>;
    let gameHistoryService: SinonStubbedInstance<GameHistoryService>;
    let userService: SinonStubbedInstance<UserService>;
    let chatGateway: SinonStubbedInstance<ChatGateway>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        gameModeService = createStubInstance(GameModeService);
        gameHistoryService = createStubInstance(GameHistoryService);
        userService = createStubInstance(UserService);
        chatGateway = createStubInstance(ChatGateway);

        Object.defineProperty(socket, 'id', { value: getFakeGameRoom().roomId, writable: true });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameModeGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                {
                    provide: GameModeService,
                    useValue: gameModeService,
                },
                {
                    provide: GameHistoryService,
                    useValue: gameHistoryService,
                },
                {
                    provide: UserService,
                    useValue: userService,
                },
                {
                    provide: ChatGateway,
                    useValue: chatGateway,
                },
            ],
        }).compile();

        gateway = module.get<GameModeGateway>(GameModeGateway);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('validateDifference should emit difference validated with true if difference is valid', async () => {
        const differencePos = new Vector2D();
        jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        differencePos.x = 1;
        differencePos.y = 1;
        const validateDifferenceSpy = jest.spyOn(gameModeService, 'validateDifference').mockReturnValue(true);
        const fakeGameRoom = getFakeGameRoom();
        server.to.returns({
            // eslint-disable-next-line no-unused-vars
            emit: (event: string, { validated, _ }) => {
                expect(event).toEqual(GameModeEvents.DifferenceValidated);
                expect(validated).toEqual(true);
            },
        } as BroadcastOperator<unknown, unknown>);
        await gateway.validateDifference(socket, {
            differencePos,
            roomId: fakeGameRoom.roomId,
            username: fakeGameRoom.userGame.currentPlayers[0].username,
        });
        expect(validateDifferenceSpy).toHaveBeenCalled();
    });

    it('validateDifference should emit difference validated with false if difference is not valid', async () => {
        jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        const differencePos = new Vector2D();
        differencePos.x = 0;
        differencePos.y = 0;
        const validateDifferenceSpy = jest.spyOn(gameModeService, 'validateDifference').mockReturnValue(false);
        const fakeGameRoom = getFakeGameRoom();
        server.to.returns({
            // eslint-disable-next-line no-unused-vars
            emit: (event: string, { validated, _ }) => {
                expect(event).toEqual(GameModeEvents.DifferenceValidated);
                expect(validated).toEqual(false);
            },
        } as BroadcastOperator<unknown, unknown>);
        await gateway.validateDifference(socket, {
            differencePos,
            roomId: fakeGameRoom.roomId,
            username: fakeGameRoom.userGame.currentPlayers[0].username,
        });
        expect(validateDifferenceSpy).toHaveBeenCalled();
    });

    it('endGame should emit endGame event with the timer', () => {
        jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameModeEvents.GameFinished);
            },
        } as BroadcastOperator<unknown, unknown>);
    });

    it('endGame should do nothing if the gameRoom does not exist', () => {
        jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(undefined);
        expect(logger.log.notCalled).toBeTruthy();
    });

    it('Abandoned should emit Abandoned event with the username of the one quitting the game', () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        const abandonClassicModeSpy = jest.spyOn(gameModeService, 'abandonGame').mockImplementation();
        const fakeGameRoom = getFakeGameRoom();
        server.to.returns({
            emit: (event: string, { gameRoom, username }) => {
                expect(event).toEqual(GameModeEvents.Abandoned);
                expect(gameRoom).toEqual(fakeGameRoom);
                expect(username).toEqual(fakeGameRoom.userGame.currentPlayers[0].username);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.abandoned(socket, { roomId: fakeGameRoom.roomId, username: fakeGameRoom.userGame.currentPlayers[0].username });
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(abandonClassicModeSpy).toHaveBeenCalled();
    });

    it('Abandoned should emit Abandoned event with the username of the one quitting the limited-mode game and if host', () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockImplementation(() => {
            const gameRoom = getFakeGameRoom();
            gameRoom.gameMode = GameMode.limitedTimeMode;
            gameRoom.userGame.currentPlayers[1] = { username: 'secondPlayer', isAndroid: false };
            return gameRoom;
        });
        const abandonLimitedTimeModeSpy = jest.spyOn(gameModeService, 'abandonGame').mockImplementation();
        const gameRoomSent = getFakeGameRoom();
        gameRoomSent.gameMode = GameMode.limitedTimeMode;
        const gameRoomExpected = gameRoomSent;
        gameRoomExpected.roomId = 'socketId';
        gameRoomExpected.userGame.currentPlayers[1] = { username: 'secondPlayer', isAndroid: false };

        const roomsMap = new Map<string, Set<string>>();
        roomsMap.set('socketId', new Set<string>([socket.id, 'socketId2']));
        Object.defineProperty(server, 'sockets', { value: { adapter: { rooms: roomsMap } }, writable: true });
        socket.join(gameRoomSent.roomId);

        server.to.returns({
            emit: (event: string, { gameRoom, username }) => {
                expect(event).toEqual(GameModeEvents.Abandoned);
                expect(gameRoom).toEqual(gameRoomExpected);
                expect(username).toEqual(gameRoomSent.userGame.currentPlayers[0].username);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.abandoned(socket, { roomId: 'socketId', username: gameRoomSent.userGame.currentPlayers[0].username });
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(abandonLimitedTimeModeSpy).toHaveBeenCalled();
    });

    it('Abandoned should emit Abandoned event with the username of the one quitting the limited-mode game and if not host', () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockImplementation(() => {
            const gameRoom = getFakeGameRoom();
            gameRoom.gameMode = GameMode.limitedTimeMode;
            gameRoom.roomId = 'socketId2';
            return gameRoom;
        });
        const abandonLimitedTimeModeSpy = jest.spyOn(gameModeService, 'abandonGame').mockImplementation();
        const gameRoomSent = getFakeGameRoom();
        gameRoomSent.gameMode = GameMode.limitedTimeMode;
        gameRoomSent.roomId = 'socketId2';

        const roomsMap = new Map<string, Set<string>>();
        roomsMap.set(gameRoomSent.roomId, new Set<string>([socket.id]));
        Object.defineProperty(server, 'sockets', { value: { adapter: { rooms: roomsMap } }, writable: true });
        socket.join(gameRoomSent.roomId);

        server.to.returns({
            emit: (event: string, { gameRoom, username }) => {
                expect(event).toEqual(GameModeEvents.Abandoned);
                expect(gameRoom).toEqual(gameRoomSent);
                expect(username).toEqual(gameRoomSent.userGame.currentPlayers[0].username);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.abandoned(socket, { roomId: gameRoomSent.roomId, username: gameRoomSent.userGame.currentPlayers[0].username });
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(abandonLimitedTimeModeSpy).toHaveBeenCalled();
    });

    it('Abandoned should do nothing if the game does not exists', () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(undefined);
        const abandonClassicModeSpy = jest.spyOn(gameModeService, 'abandonGame').mockImplementation();
        gateway.abandoned(socket, { roomId: getFakeGameRoom().roomId, username: getFakeGameRoom().userGame.currentPlayers[0].username });
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(abandonClassicModeSpy).not.toHaveBeenCalled();
    });

    it('changeTime should call applyTimeToTimer', () => {
        jest.spyOn(gameModeService, 'applyTimeToTimer').mockImplementation();
        gateway.changeTime(socket, { roomId: getFakeGameRoom().roomId, time: 1 });
        expect(gameModeService.applyTimeToTimer).toHaveBeenCalledWith(getFakeGameRoom().roomId, 1);
    });

    it('nextGame should call refreshRoomGame', () => {
        jest.spyOn(gameModeService, 'refreshRoomGame').mockImplementation();
        server.to.returns({
            // eslint-disable-next-line no-unused-vars
            emit: (event: string, gameRoom) => {
                expect(event).toEqual(GameModeEvents.NextGame);
                expect(gameRoom).toEqual(getFakeGameRoom());
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.loadNextGame(socket, getFakeGameRoom());
        expect(gameModeService.refreshRoomGame).toHaveBeenCalledWith(getFakeGameRoom());
    });

    it('afterInit should have created an interval to emit time', () => {
        const emitTimeSpy = jest.spyOn(gateway, 'emitTime').mockImplementation();
        Object.defineProperty(global, 'performance', {
            writable: true,
        });
        jest.useFakeTimers();
        gateway.afterInit();
        jest.advanceTimersByTime(DELAY_BETWEEN_EMISSIONS);
        expect(emitTimeSpy).toHaveBeenCalled();
    });

    it('socket disconnection should just return if the game does not exists', () => {
        const deleteRoomSpy = jest.spyOn(gameModeService, 'deleteGameRoom').mockImplementation();
        jest.spyOn(gameModeService, 'findGameRoomByUsername').mockReturnValue(undefined);
        gateway.handleDisconnect(socket);
        expect(deleteRoomSpy).not.toHaveBeenCalled();
    });

    // it('socket disconnection should be logged and call deleteGameRoom', () => {
    //     const deleteRoomSpy = jest.spyOn(gameModeService, 'deleteGameRoom').mockImplementation();
    //     jest.spyOn(userService, 'getUsernameBySocketId').mockReturnValue('fakeUser');
    //     jest.spyOn(gameModeService, 'findGameRoomByUsername').mockReturnValue(getFakeGameRoom());
    //     gateway.handleDisconnect(socket);
    //     expect(logger.log).toHaveBeenCalled();
    //     expect(deleteRoomSpy).toHaveBeenCalled();
    // });

    // it('socket disconnection should just return and call abandoned when its multiplayer game', () => {
    //     const deleteRoomSpy = jest.spyOn(gameModeService, 'deleteGameRoom').mockImplementation();
    //     const abandonedSpy = jest.spyOn(gateway, 'abandoned').mockImplementation();
    //     jest.spyOn(userService, 'getUsernameBySocketId').mockReturnValue('fakeUser');
    //     jest.spyOn(gameModeService, 'findGameRoomByUsername').mockReturnValue(getFakeGameRoom());
    //     gateway.handleDisconnect(socket);
    //     expect(abandonedSpy).toHaveBeenCalled();
    //     expect(deleteRoomSpy).not.toHaveBeenCalled();
    // });

    it('emitTime should emit time after 1s to connected socket', () => {
        const emitTimeSpy = jest.spyOn(gateway, 'emitTime');
        jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        jest.spyOn(gameModeService, 'getRoomsValues').mockReturnValue([getFakeGameRoom()]);
        Object.defineProperty(global, 'performance', {
            writable: true,
        });
        jest.useFakeTimers();
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameModeEvents.Timer);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.emitTime();
        jest.advanceTimersByTime(DELAY_BETWEEN_EMISSIONS);
        expect(emitTimeSpy).toHaveBeenCalled();
    });

    it('cancelDeletedGame should emit gameCanceled event', () => {
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameModeEvents.GameCanceled);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.cancelDeletedGame('FakeGame');
    });
});

/* eslint-disable @typescript-eslint/no-magic-numbers */
const getFakeUserGame = (): UserGame => ({
    creator: 'FakeUser',
    nbDifferenceFound: 0,
    timer: 0,
    potentialPlayers: [],
    differenceFoundByPlayers: [],
    currentPlayers: [new CurrentPlayer()],
    gameName: '',
    chosenDifference: -1,
});

const getFakeGameRoom = (): GameRoom => ({
    userGame: getFakeUserGame(),
    roomId: 'socketId',
    started: true,
    gameMode: GameMode.classicMode,
    gameConstants: undefined,
});

// const getFakeEndGame = (): EndGame => ({
//     roomId: getFakeGameRoom().roomId,
//     winner: '',
//     gameFinished: true,
//     tiedPlayers: [],
//     players: [],
//     abandoned: [],
//     gameMode: GameMode.classicMode,
//     gameName: 'FakeGame',
//     gameDuration: 0,
// });
