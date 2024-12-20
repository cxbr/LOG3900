import { GameFinderGateway } from '@app/gateways/game-finder/game-finder.gateway';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { GameRoom } from '@common/classes/game-room';
import { CurrentPlayer, UserGame } from '@common/classes/user-game';
import { GameFinderEvents } from '@common/enums/game-finder.gateway.variables';
import { GameMode } from '@common/game-mode';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('GameFinderGateway', () => {
    let gateway: GameFinderGateway;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let gameModeService: SinonStubbedInstance<GameModeService>;
    let gameHistoryService: SinonStubbedInstance<GameHistoryService>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        gameModeService = createStubInstance(GameModeService);
        gameHistoryService = createStubInstance(GameHistoryService);

        Object.defineProperty(socket, 'id', { value: getFakeGameRoom().roomId, writable: true });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameFinderGateway,
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
            ],
        }).compile();

        gateway = module.get<GameFinderGateway>(GameFinderGateway);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('checkGame should emit gameName and event GameFound if the game exists in mode Classique', async () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        const loggerSpy = jest.spyOn(logger, 'log');
        const dataSent = { gameName: 'fakeGame', gameMode: GameMode.classicMode };
        server.to.returns({
            emit: (event: string, { gameName, gameMode }) => {
                expect(event).toEqual(GameFinderEvents.GameFound);
                expect(gameName).toEqual(dataSent.gameName);
                expect(gameMode).toEqual(dataSent.gameMode);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.checkIfGameExists(socket, dataSent);
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(loggerSpy).toHaveBeenCalledWith(`Game finder gateway: Game ${dataSent.gameName} found`);
    });

    it('checkGame should emit gameName and event GameFound if the game exists in mode Temps Limité', async () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(getFakeGameRoom());
        const loggerSpy = jest.spyOn(logger, 'log');
        const dataSent = { gameName: 'fakeGame', gameMode: GameMode.limitedTimeMode };
        server.to.returns({
            emit: (event: string, { gameName, gameMode }) => {
                expect(event).toEqual(GameFinderEvents.GameFound);
                expect(gameName).toEqual(dataSent.gameName);
                expect(gameMode).toEqual(dataSent.gameMode);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.checkIfGameExists(socket, dataSent);
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(loggerSpy).toHaveBeenCalledWith('Game finder gateway: Limited time game found');
    });

    it('checkGame should not emit gameName and event GameFound if the game exists but started', async () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockImplementation(() => {
            const gameRoom = getFakeGameRoom();
            gameRoom.started = true;
            return gameRoom;
        });
        const loggerSpy = jest.spyOn(logger, 'log');
        const dataSent = { gameName: 'fakeGame', gameMode: GameMode.classicMode };
        gateway.checkIfGameExists(socket, dataSent);
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(loggerSpy).not.toHaveBeenCalledWith(`Game finder gateway: Game ${dataSent.gameName} found`);
    });

    it('checkGame should not emit gameName and event GameFound if the gameRoom do not exists', async () => {
        const getGameRoomSpy = jest.spyOn(gameModeService, 'getGameRoom').mockReturnValue(undefined);
        const loggerSpy = jest.spyOn(logger, 'log');
        const dataSent = { gameName: 'fakeGame', gameMode: GameMode.classicMode };
        gateway.checkIfGameExists(socket, dataSent);
        expect(getGameRoomSpy).toHaveBeenCalled();
        expect(loggerSpy).toHaveBeenCalledWith(`Game finder gateway: No game ${dataSent.gameName} found`);
    });

    it('canJoinGame should emit event CanJoinGame if the game exists and is joinable', async () => {
        const canJoinGameSpy = jest.spyOn(gameModeService, 'canJoinGame').mockReturnValue(getFakeGameRoom());
        const dataSent = { gameName: 'fakeGame', username: 'fakeUser', gameMode: GameMode.classicMode };
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameFinderEvents.CanJoinGame);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.checkIfUserCanJoinGame(socket, dataSent);
        expect(canJoinGameSpy).toHaveBeenCalled();
    });

    it('canJoinGame should emit event CannotJoinGame if the game exists and is not joinable', async () => {
        const canJoinGameSpy = jest.spyOn(gameModeService, 'canJoinGame').mockReturnValue(undefined);
        const dataSent = { gameName: 'fakeGame', username: 'fakeUser', gameMode: GameMode.classicMode };
        server.to.returns({
            emit: (event: string) => {
                expect(event).toEqual(GameFinderEvents.CannotJoinGame);
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.checkIfUserCanJoinGame(socket, dataSent);
        expect(canJoinGameSpy).toHaveBeenCalled();
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
    started: false,
    gameMode: GameMode.classicMode,
    gameConstants: undefined,
});
