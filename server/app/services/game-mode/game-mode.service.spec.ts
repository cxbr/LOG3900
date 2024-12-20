// We want to assign a value to the private field
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { environment } from '@app/environments/environment';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameHistory } from '@app/model/database/game-history';
import { Vector2D } from '@app/model/schema/vector2d.schema';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { GameService } from '@app/services/game/game.service';
import { UserService } from '@app/services/user/user.service';
import { BestTime } from '@common/classes/best-time';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { CurrentPlayer, UserGame } from '@common/classes/user-game';
import { GameMode } from '@common/game-mode';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Socket } from 'socket.io';

class TestGameModeService extends GameModeService {
    addElementToMap(key: string, value: GameRoom) {
        (this as any).gameRooms.set(key, value);
    }

    addElementToDataMap(key: string, value: GameData) {
        (this as any).gamesData.set(key, value);
    }

    addElementToHistoryMap(key: string, value: GameHistory) {
        (this as any).gameHistory.set(key, value);
    }
}

describe('GameModeService', () => {
    let service: GameModeService;
    let testGameModeService: TestGameModeService;
    let socket: SinonStubbedInstance<Socket>;
    let gameHistoryService: SinonStubbedInstance<GameHistoryService>;
    let userService: SinonStubbedInstance<UserService>;
    let gameService: SinonStubbedInstance<GameService>;
    let chatGateway: SinonStubbedInstance<ChatGateway>;
    beforeEach(async () => {
        socket = createStubInstance<Socket>(Socket);
        gameHistoryService = createStubInstance<GameHistoryService>(GameHistoryService);
        userService = createStubInstance<UserService>(UserService);
        gameService = createStubInstance<GameService>(GameService);
        chatGateway = createStubInstance<ChatGateway>(ChatGateway);
        Object.defineProperty(socket, 'id', { value: getFakeGameRoom().roomId, writable: true });
        gameService.getGame.resolves(getFakeGameData());
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: GameModeService,
                    useClass: TestGameModeService,
                },
                {
                    provide: GameService,
                    useValue: gameService,
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
                TestGameModeService,
            ],
        }).compile();

        service = module.get<GameModeService>(GameModeService);
        testGameModeService = module.get<TestGameModeService>(TestGameModeService);
        testGameModeService.addElementToDataMap('socketId', getFakeGameData());
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getGameRoom should return room if the roomId is defined', () => {
        (testGameModeService as any).gameRooms = new Map();
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.getGameRoom(newRoom.roomId)).toEqual(newRoom);
    });

    it('getGameRoom should return room defined by the name and gamemode', () => {
        (testGameModeService as any).gameRooms = new Map();
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.getGameRoom(undefined, newRoom.userGame.gameName, newRoom.gameMode)).toEqual(newRoom);
    });

    it('getGameRoom should return room defined by gamemode (time-limited)', () => {
        (testGameModeService as any).gameRooms = new Map();
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.getGameRoom(undefined, undefined, newRoom.gameMode)).toEqual(newRoom);
    });

    it('getGameRoom should return undefined if the game does not exists', () => {
        const newRoom = getFakeGameRoom();
        expect(testGameModeService.getGameRoom(newRoom.roomId)).toEqual(undefined);
    });

    it('getGameRoom should not return the gameRoom if started is true', () => {
        const newRoom = getFakeGameRoom();
        newRoom.started = true;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.getGameRoom(newRoom.userGame.gameName)).toEqual(undefined);
    });

    it('getGameRoom should not return undefined if no game is found', () => {
        expect(testGameModeService.getGameRoom('notaRealGame')).toEqual(undefined);
    });

    it('setGameRoom should add room', () => {
        (testGameModeService as any).gameRooms = new Map();
        const newRoom = getFakeGameRoom();
        testGameModeService.setGameRoom(newRoom);
        expect((testGameModeService as any).gameRooms.get(newRoom.roomId)).toEqual(newRoom);
    });

    it('getGameHistory should return gameHistory', () => {
        (testGameModeService as any).gameHistory = new Map();
        const newGameHistory = getFakeGameHistory();
        testGameModeService.addElementToHistoryMap(getFakeGameRoom().roomId, newGameHistory);
        expect(testGameModeService.getGameHistory(getFakeGameRoom().roomId)).toEqual(newGameHistory);
    });

    it('setGameHistory should add history', () => {
        (testGameModeService as any).gameHistory = new Map();
        const newGameHistory = getFakeGameHistory();
        testGameModeService.setGameHistory(getFakeGameRoom().roomId, newGameHistory);
        expect((testGameModeService as any).gameHistory.get(getFakeGameRoom().roomId)).toEqual(newGameHistory);
    });

    it('deleteGameHistory should delete gameHistory', () => {
        (testGameModeService as any).gameHistory = new Map();
        const newGameHistory = getFakeGameHistory();
        testGameModeService.addElementToHistoryMap(getFakeGameRoom().roomId, newGameHistory);
        testGameModeService.deleteGameHistory(getFakeGameRoom().roomId);
        expect(testGameModeService.getGameRoom(getFakeGameRoom().roomId)).toEqual(undefined);
    });

    it('deleteGameRoom should delete room', () => {
        (testGameModeService as any).gameRooms = new Map();
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        testGameModeService.deleteGameRoom(newRoom.roomId);
        expect(testGameModeService.getGameRoom(newRoom.roomId)).toBeUndefined();
    });

    it('nextGame should set the next gameRoom', () => {
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        const newRoomModified = newRoom;
        newRoomModified.userGame.gameName = 'anotherFakeGame';
        testGameModeService.refreshRoomGame(newRoomModified);
        expect(testGameModeService.getGameRoom(newRoom.roomId)).toEqual(newRoomModified);
    });

    it('nextGame should do nothing if its a mode Classique game', () => {
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        const newRoomModified = newRoom;
        newRoomModified.userGame.gameName = 'anotherFakeGame';
        testGameModeService.refreshRoomGame(newRoomModified);
        expect(testGameModeService.getGameRoom(newRoom.roomId)).toEqual(newRoom);
    });

    it('joinGame should return true when socket has joined the game', () => {
        jest.spyOn(service, 'getGameRoom').mockImplementation(() => {
            return getFakeGameRoom();
        });
        const newRoom = getFakeGameRoom();
        socket.join.returns();
        expect(
            service.joinGame(socket, {
                gameName: newRoom.userGame.gameName,
                user: { username: 'FakeUserJoining', isAndroid: false },
                gameMode: GameMode.classicMode,
                roomId: socket.id,
            }),
        ).toEqual(true);
        jest.spyOn(service, 'getGameRoom').mockRestore();
        jest.spyOn(service, 'getGameRoom').mockImplementation(() => {
            const fakeRoom = getFakeGameRoom();
            fakeRoom.userGame.potentialPlayers.push({ username: 'FakeUserJoining', isAndroid: false });
            return fakeRoom;
        });
        expect(service.getGameRoom(newRoom.roomId).userGame.potentialPlayers).toContainEqual({ username: 'FakeUserJoining', isAndroid: false });
    });

    it('joinGame should return false if the gameName is undefined', () => {
        expect(
            service.joinGame(socket, {
                gameName: undefined,
                user: { username: 'FakeUserJoining', isAndroid: false },
                gameMode: GameMode.classicMode,
                roomId: socket.id,
            }),
        ).toEqual(false);
    });

    // it('saveGameHistory should correctly save game history with classic gamemode when only one username', () => {
    //     const fakeGameRoom = getFakeGameRoom();
    //     service.saveGameHistory(fakeGameRoom);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).name).toEqual(fakeGameRoom.userGame.gameData.name);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).gameMode).toEqual('Classique Solo');
    // });

    // it('saveGameHistory should correctly save game history with classic gamemode when has two usernames', () => {
    //     const fakeGameRoom = getFakeGameRoom();
    //     fakeGameRoom.userGame.currentPlayers[1] = 'FakeUser2';
    //     service.saveGameHistory(fakeGameRoom);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).players[1]).toEqual(fakeGameRoom.userGame.currentPlayers[1]);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).name).toEqual(fakeGameRoom.userGame.gameData.name);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).gameMode).toEqual('Classique 1v1');
    // });

    // it('saveGameHistory should correctly save game history with time-limited gamemode when only one username', () => {
    //     const fakeGameRoom = getFakeGameRoom();
    //     fakeGameRoom.gameMode = GameMode.limitedTimeMode;
    //     service.saveGameHistory(fakeGameRoom);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).name).toEqual(fakeGameRoom.userGame.gameData.name);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).gameMode).toEqual('Temps Limité Solo');
    // });

    // it('saveGameHistory should correctly save game history with time-limited gamemode when two usernames', () => {
    //     const fakeGameRoom = getFakeGameRoom();
    //     fakeGameRoom.userGame.currentPlayers[1] = 'FakeUser2';
    //     fakeGameRoom.gameMode = GameMode.limitedTimeMode;
    //     service.saveGameHistory(fakeGameRoom);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).name).toEqual(fakeGameRoom.userGame.gameData.name);
    //     expect(service.getGameHistory(fakeGameRoom.roomId).gameMode).toEqual('Temps Limité Coopératif');
    // });

    it('validateDifference should return true if the difference is valid', () => {
        const newRoom = getFakeGameRoom();
        const position = new Vector2D();
        position.x = 1;
        position.y = 1;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.validateDifference(newRoom.roomId, position, '')).toBeTruthy();
    });

    it('validateDifference should return false if the difference is not valid', () => {
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.validateDifference(newRoom.roomId, { x: 0, y: 0 }, '')).toBeFalsy();
    });

    it('validateDifference should return false if gameRoom is undefined', () => {
        expect(testGameModeService.validateDifference(getFakeGameRoom().roomId, { x: 0, y: 0 }, '')).toBeFalsy();
    });

    it('isGameFinished should return true if all differences have been found on mode Classique', () => {
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        testGameModeService
            .getGameRoom(newRoom.roomId)
            .userGame.differenceFoundByPlayers.push({ username: newRoom.userGame.currentPlayers[0].username, differencesFound: 2 });
        expect(testGameModeService.isGameFinished(newRoom)).toBeTruthy();
    });

    // it('isGameFinished should return false if the gameRoom does not exists', () => {
    //     const newRoom = getFakeGameRoom();
    //     expect(testGameModeService.isGameFinished(newRoom)).toBeFalsy();
    // });

    // it('isGameFinished should return false if not all differences have been found', () => {
    //     const newRoom = getFakeGameRoom();
    //     testGameModeService.addElementToMap(newRoom.roomId, newRoom);
    //     testGameModeService
    //         .getGameRoom(newRoom.roomId)
    //         .userGame.differenceFoundByPlayers.push({ username: newRoom.userGame.currentPlayers[0].username, differencesFound: 1 });
    //     expect(testGameModeService.isGameFinished(newRoom)).toBeFalsy();
    // });

    it('isGameFinished should return true if timer is 0 on time-limited', () => {
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        newRoom.userGame.timer = 0;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.isGameFinished(newRoom)).toBeTruthy();
    });

    it('isGameFinished should return false if timer is above 0 on time-limited', () => {
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        newRoom.userGame.timer = 10;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.isGameFinished(newRoom)).toBeFalsy();
    });

    // it('abandonGameHistory should correctly update game history when game was abandoned', () => {
    //     (testGameModeService as any).gameHistory = new Map();
    //     jest.spyOn(service, 'getGameHistory').mockReturnValue(getFakeGameHistory());
    //     jest.spyOn(service as any, 'updateGameHistory').mockImplementation();
    //     const newGameHistory = getFakeGameHistory();
    //     testGameModeService.addElementToHistoryMap(getFakeGameRoom().roomId, newGameHistory);
    //     service.abandonGameHistory(getFakeGameRoom().roomId, getFakeGameRoom().userGame.currentPlayers[0]);
    //     expect((service as any).updateGameHistory).toHaveBeenCalled();
    // });

    // it('abandonGameHistory should correctly update game history when game was abandoned and we are in a multiplayer lobby', () => {
    //     (testGameModeService as any).gameHistory = new Map();
    //     jest.spyOn(service, 'getGameHistory').mockImplementation(() => {
    //         const gameHistory = getFakeGameHistory();
    //         gameHistory.username2 = 'FakeUser2';
    //         return gameHistory;
    //     });
    //     service.abandonGameHistory(getFakeGameRoom().roomId, getFakeGameRoom().userGame.currentPlayers[0]);
    //     jest.spyOn(service, 'getGameHistory').mockRestore();
    //     expect(service.getGameHistory(getFakeGameRoom().roomId).abandoned).toEqual(['FakeUser']);
    // });

    it('initNewRoom should create a new room with the given id', () => {
        const roomId = 'socketId';
        socket.join.returns();
        service.initNewRoom(socket, getFakeGameRoom());
        expect(service.getGameRoom(roomId)).toBeDefined();
    });

    it('canJoinGame should return undefined if the game does not exist', () => {
        expect(
            service.canJoinGame({ gameName: getFakeGameRoom().userGame.gameName, username: 'FakeUser', gameMode: GameMode.classicMode }),
        ).toBeUndefined();
    });

    it('canJoinGame should return the gameRoom if the game is joinable', () => {
        jest.spyOn(service, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        expect(
            service.canJoinGame({
                gameName: getFakeGameRoom().userGame.gameName,
                username: 'FakeUser2',
                gameMode: GameMode.classicMode,
            }),
        ).toEqual(getFakeGameRoom());
    });

    it('applyTimeToTimer should correctly add time to userGame timer', () => {
        const fakeGameRoom = getFakeGameRoom();
        jest.spyOn(service, 'getGameRoom').mockReturnValue(fakeGameRoom);
        jest.spyOn(service, 'setGameRoom').mockImplementation();
        const time = 10;
        service.applyTimeToTimer(fakeGameRoom.roomId, time);
        expect(fakeGameRoom.userGame.timer).toEqual(time);
    });

    it('getRoomsValues should return an array of game rooms', () => {
        (testGameModeService as any).gameRooms = new Map();
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        expect(testGameModeService.getRoomsValues()).toEqual([newRoom]);
    });

    it('applyTimeToTimer should do nothing if gameRoom does not exists', () => {
        const fakeGameRoom = getFakeGameRoom();
        const setGameRoomSpy = jest.spyOn(service, 'setGameRoom').mockImplementation();
        const time = 10;
        service.applyTimeToTimer(fakeGameRoom.roomId, time);
        expect(setGameRoomSpy).not.toHaveBeenCalled();
    });

    it('updateTimer should increment timer in mode Classique', () => {
        const newRoom = getFakeGameRoom();
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        testGameModeService.updateTimer(newRoom);
        expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.timer).toEqual(1);
    });

    it('updateTimer should decrement timer in mode Classique', () => {
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        newRoom.userGame.timer = 10;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        testGameModeService.updateTimer(newRoom);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.timer).toEqual(9);
    });

    it('updateTimer should decrement timer to 10 if above limit in time-limited mode', () => {
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        newRoom.userGame.timer = 1000;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        testGameModeService.updateTimer(newRoom);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.timer).toEqual(10);
    });

    it('updateTimer should put timer at 0 if it is below 0 in time-limited mode', () => {
        const newRoom = getFakeGameRoom();
        newRoom.gameMode = GameMode.limitedTimeMode;
        newRoom.userGame.timer = -10;
        testGameModeService.addElementToMap(newRoom.roomId, newRoom);
        testGameModeService.updateTimer(newRoom);
        expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.timer).toEqual(0);
    });

    // it('endGame should save game history and remove game room', () => {
    //     (testGameModeService as any).gameRooms = new Map();
    //     const newRoom = getFakeGameRoom();
    //     testGameModeService.addElementToMap(newRoom.roomId, newRoom);
    //     const updateGameHistorySpy = jest.spyOn(testGameModeService as any, 'updateGameHistory').mockImplementation();
    //     const saveGameHistorySpy = jest.spyOn(gameHistoryService, 'saveGameHistory').mockImplementation();
    //     jest.spyOn(testGameModeService, 'getGameHistory').mockReturnValue(getFakeGameHistory());
    //     testGameModeService.endGame(newRoom);
    //     expect(updateGameHistorySpy).toHaveBeenCalled();
    //     expect(saveGameHistorySpy).toHaveBeenCalled();
    //     expect(testGameModeService.getGameRoom(newRoom.roomId)).toBeUndefined();
    // });

    // TODO: FIX this AFTER GAME HISTORY IS INTEGRATED WITH 4 PLAYERS
    // it('abandonClassicMode should correctly save game history', () => {
    //     const abandonGameHistorySpy = jest.spyOn(service, 'abandonGameHistory').mockImplementation();
    //     const saveGameHistorySpy = jest.spyOn(gameHistoryService, 'saveGameHistory').mockImplementation();
    //     service.abandonClassicMode(getFakeGameRoom(), getFakeGameRoom().userGame.currentPlayers[0]);
    //     expect(abandonGameHistorySpy).toHaveBeenCalled();
    //     expect(saveGameHistorySpy).toHaveBeenCalled();
    // });

    // it('abandonLimitedTimeMode should change username if user 1 quit and update gameRoom', () => {
    //     (testGameModeService as any).gameRooms = new Map();
    //     const newRoom = getFakeGameRoom();
    //     newRoom.userGame.currentPlayers[1] = 'FakeUser2';
    //     testGameModeService.addElementToMap(newRoom.roomId, newRoom);
    //     (testGameModeService as any).gameHistory = new Map();
    //     const newGameHistory = getFakeGameHistory();
    //     testGameModeService.addElementToHistoryMap(newRoom.roomId, newGameHistory);
    //     testGameModeService.abandonGame(newRoom, newRoom.userGame.currentPlayers[0]);
    //     expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.currentPlayers[0]).toEqual('FakeUser2');
    //     expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.abandonedPlayers[0]).toEqual('FakeUser');
    // });

    // it('abandonLimitedTimeMode should change username if user quit and update gameRoom', () => {
    //     (testGameModeService as any).gameRooms = new Map();
    //     const newRoom = getFakeGameRoom();
    //     testGameModeService.addElementToMap(newRoom.roomId, newRoom);
    //     (testGameModeService as any).gameHistory = new Map();
    //     const newGameHistory = getFakeGameHistory();
    //     testGameModeService.addElementToHistoryMap(newRoom.roomId, newGameHistory);
    //     testGameModeService.abandonGame(newRoom, newRoom.userGame.currentPlayers[0]);
    //     expect(testGameModeService.getGameRoom(newRoom.roomId).userGame.abandonedPlayers[0]).toEqual('FakeUser');
    // });

    // it('updateGameHistory should correctly update game history when user is the winner', () => {
    //     (testGameModeService as any).gameHistory = new Map();
    //     const newGameHistory = getFakeGameHistory();
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     jest.spyOn(Date, 'now').mockReturnValue(20);
    //     const fakeEndGame: EndGame = getEndGame();
    //     const fakeGameRoom = getFakeGameRoom();
    //     testGameModeService.addElementToHistoryMap(getFakeGameRoom().roomId, newGameHistory);
    //     testGameModeService.addElementToMap(fakeGameRoom.roomId, fakeGameRoom);
    //     (testGameModeService as any).updateGameHistory(fakeEndGame);
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     expect(testGameModeService.getGameHistory(fakeGameRoom.roomId).timer).toEqual(10);
    //     expect(testGameModeService.getGameHistory(fakeGameRoom.roomId).winner).toEqual('FakeUser');
    // });

    // it('updateGameHistory should correctly update game history when game was abandoned', () => {
    //     (testGameModeService as any).gameHistory = new Map();
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     jest.spyOn(Date, 'now').mockReturnValue(20);
    //     const newGameHistory = getFakeGameHistory();
    //     const fakeEndGame: EndGame = getEndGame();
    //     const fakeGameRoom = getFakeGameRoom();
    //     testGameModeService.addElementToHistoryMap(getFakeGameRoom().roomId, newGameHistory);
    //     testGameModeService.addElementToMap(fakeGameRoom.roomId, fakeGameRoom);
    //     (testGameModeService as any).updateGameHistory(fakeEndGame);
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     expect(testGameModeService.getGameHistory(fakeGameRoom.roomId).timer).toEqual(10);
    //     expect(testGameModeService.getGameHistory(fakeGameRoom.roomId).abandoned).toEqual(['FakeUser']);
    // });

    // it('updateGameHistory should correctly update game history with no winners if its a solo game', () => {
    //     (testGameModeService as any).gameHistory = new Map();
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     jest.spyOn(Date, 'now').mockReturnValue(20);
    //     const newGameHistory = getFakeGameHistory();
    //     const fakeEndGame: EndGame = getEndGame();
    //     const fakeGameRoom = getFakeGameRoom();
    //     testGameModeService.addElementToHistoryMap(getFakeGameRoom().roomId, newGameHistory);
    //     testGameModeService.addElementToMap(fakeGameRoom.roomId, fakeGameRoom);
    //     (testGameModeService as any).updateGameHistory(fakeEndGame);
    //     // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    //     expect(testGameModeService.getGameHistory(fakeGameRoom.roomId).timer).toEqual(10);
    //     expect(testGameModeService.getGameHistory(fakeGameRoom.roomId).winner).toEqual('Aucun gagnant');
    // });

    it('GameRoom should be of type GameRoom', () => {
        const newRoom = new GameRoom();
        expect(newRoom).toBeInstanceOf(GameRoom);
    });
});

/* eslint-disable @typescript-eslint/no-magic-numbers */
const getFakeUserGame = (): UserGame => ({
    creator: 'FakeUser',
    nbDifferenceFound: 0,
    timer: 0,
    gameName: 'FakeGame',
    chosenDifference: -1,
    currentPlayers: [new CurrentPlayer()],
    potentialPlayers: [],
    differenceFoundByPlayers: [],
});

const getFakeGameData = (): GameData => ({
    differenceMatrix: [
        [-1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ],
    creator: 'fake',
    wantShoutout: false,
    name: 'FakeGame',
    differenceHashMap: [],
    nbDifference: 2,
    image1url: `${environment.serverUrl}/games/FakeGame/image1.bmp`,
    image2url: `${environment.serverUrl}/games/FakeGame/image2.bmp`,
    difficulty: 'facile',
    soloBestTimes: newBestTimes(),
    vsBestTimes: newBestTimes(),
});

const newBestTimes = (): BestTime[] => [
    { name: 'Joueur 1', time: 60 },
    { name: 'Joueur 2', time: 120 },
    { name: 'Joueur 3', time: 180 },
];

const getFakeGameRoom = (): GameRoom => ({
    userGame: getFakeUserGame(),
    roomId: 'socketId',
    started: false,
    gameMode: GameMode.classicMode,
    gameConstants: { gameDuration: 10, penaltyTime: 0, bonusTime: 0, cheatMode: false },
});

const getFakeGameHistory = (): GameHistory => ({
    name: 'FakeGame',
    startTime: 10,
    timer: 0,
    players: ['FakeUser'],
    _id: undefined,
    gameMode: GameMode.classicMode,
    abandoned: undefined,
    playerDiff: [],
    winner: undefined,
    deletedByUsers: undefined,
});

// const newBestTimes = (): BestTime[] => [
//     { name: 'Player 1', time: 60 },
//     { name: 'Player 2', time: 120 },
//     { name: 'Player 3', time: 180 },
// ];

// const getEndGame = (): EndGame => ({
//     winner: '',
//     roomId: 'socketId',
//     gameFinished: true,
//     tiedPlayers: [],
//     abandoned: [],
//     players: [],
//     gameMode: GameMode.classicMode,
//     gameName: 'FakeGame',
//     gameDuration: 10,
// });
