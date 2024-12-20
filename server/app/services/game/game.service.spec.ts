/* eslint-disable max-lines */
import { DELAY_BEFORE_CLOSING_CONNECTION, NOT_TOP3 } from '@app/constants/constants';
import { environment } from '@app/environments/environment';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameModeGateway } from '@app/gateways/game-mode/game-mode.gateway';
import { Game, GameDocument, gameSchema } from '@app/model/database/game';
import { NewBestTime } from '@app/model/dto/game/new-best-time.dto';
import { GameService } from '@app/services/game/game.service';
import { GameImageService } from '@app/services/image/game-image.service';
import { BestTime } from '@common/classes/best-time';
import { GameData } from '@common/classes/game-data';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

jest.mock('@app/gateways/game-mode/game-mode.gateway');

describe('GameService', () => {
    let service: GameService;
    let gameModel: Model<GameDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;
    let gameModeGateway: SinonStubbedInstance<GameModeGateway>;
    let chatGateway: SinonStubbedInstance<ChatGateway>;
    let gameImageService: SinonStubbedInstance<GameImageService>;

    const timeoutTime = 1000;

    beforeEach(async () => {
        gameModeGateway = createStubInstance(GameModeGateway);
        chatGateway = createStubInstance(ChatGateway);
        mongoServer = await MongoMemoryServer.create();
        gameImageService = createStubInstance(GameImageService);
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                    imports: undefined,
                }),
                MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]),
            ],
            providers: [
                {
                    provide: GameModeGateway,
                    useValue: gameModeGateway,
                },
                {
                    provide: ChatGateway,
                    useValue: chatGateway,
                },
                {
                    provide: GameImageService,
                    useValue: gameImageService,
                },
                GameService,
            ],
        }).compile();

        service = module.get<GameService>(GameService);
        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
        connection = await module.get(getConnectionToken());
    });

    afterEach((done) => {
        // The database get auto populated in the constructor
        // We want to make sur we close the connection after the database got
        // populated. So we add small delay
        setTimeout(async () => {
            await connection.close();
            await mongoServer.stop();
            done();
        }, DELAY_BEFORE_CLOSING_CONNECTION);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(gameModel).toBeDefined();
    });

    it('getAllGames should return all games in database', async () => {
        jest.spyOn(gameImageService, 'getMatrix').mockImplementation(async () => Promise.resolve([]));
        await gameModel.deleteMany({});
        expect(await service.getAllGames()).toEqual([]);
        const game = getFakeGame();
        await gameModel.create(game);
        expect((await service.getAllGames()).length).toEqual(1);
    });

    it('createNewGame should add the game to the DB', async () => {
        await gameModel.deleteMany({});
        const game = getFakeGameData();
        await service.createNewGame({
            name: game.name,
            nbDifference: game.nbDifference,
            creator: game.creator,
            wantShoutout: game.wantShoutout,
            difficulty: game.difficulty,
            image1: '...',
            image2: '...',
            differenceHashMap: [],
            differenceMatrix: game.differenceMatrix,
        });
        expect(await gameModel.countDocuments()).toEqual(1);
    });

    it('createNewGame should not add game if the database throw an error', async () => {
        jest.spyOn(gameModel, 'create').mockImplementation(async () => Promise.reject(''));
        await gameModel.deleteMany({});
        const game = getFakeGameData();
        await expect(
            service.createNewGame({
                name: game.name,
                nbDifference: game.nbDifference,
                difficulty: game.difficulty,
                creator: game.creator,
                wantShoutout: game.wantShoutout,
                image1: '...',
                image2: '...',
                differenceHashMap: [],
                differenceMatrix: game.differenceMatrix,
            }),
        ).rejects.toBeTruthy();
    });

    // TODO: test fails, unable to mock saveImage
    // it('createNewGame should fail if fs.write of saveImage fails', async () => {
    //     jest.spyOn(gameImageService, 'saveImage').mockRejectedValue('');
    //     await gameModel.deleteMany({});
    //     const game = getFakeGameData();
    //     await expect(
    //         service.createNewGame({
    //             name: game.name,
    //             nbDifference: game.nbDifference,
    //             difficulty: game.difficulty,
    //             image1: '...',
    //             image2: '...',
    //             differenceMatrix: game.differenceMatrix,
    //         }),
    //     ).rejects.toBeTruthy();
    // });

    it('getGame should return undefined if the game with the specified subject code does not exist', async () => {
        await expect(service.getGame('404')).rejects.toEqual('Failed to get game');
    });

    it('getGame should return the game with the specified name', async () => {
        const gameData = getFakeGameData();
        jest.spyOn(gameImageService, 'getMatrix').mockImplementation(async () => Promise.resolve(gameData.differenceMatrix));
        jest.spyOn(gameImageService, 'getDifferencesHashMap').mockImplementation(async () => Promise.resolve(gameData.differenceHashMap));
        const game = getFakeGame();
        await gameModel.create(game);
        expect(await service.getGame(game.name)).toEqual(expect.objectContaining(getFakeGameData()));
    });

    it('getBestTime should return the best times of the game for solo and vs', async () => {
        const game = getFakeGame();
        await gameModel.create(game);
        expect(await service.getBestTime(game.name)).toEqual({
            soloBestTimes: game.soloBestTimes,
            vsBestTimes: game.vsBestTimes,
        });
    });

    it('getBestTime should return undefined if the game does not exist', async () => {
        expect(await service.getBestTime('FakeGame')).toEqual(undefined);
    });

    it('calculateDifficulty should return the correct difficulty', async () => {
        await gameModel.deleteMany({});
        const game = getFakeGame2();
        await gameModel.create(game);
        const getGame = await service.getGame(game.name);
        expect(getGame.difficulty).toEqual('difficile');
    });

    it('deleteGame should fail if the game does not exist', async () => {
        await gameModel.deleteMany({});
        const game = getFakeGame();
        await expect(service.deleteGame(game.name)).rejects.toBeTruthy();
    });

    it('deleteGame should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'deleteOne').mockRejectedValue('');
        const game = getFakeGame();
        await expect(service.deleteGame(game.name)).rejects.toEqual('Could not find game');
    });

    it('deleteAllGames should fail if mongo query failed', async () => {
        jest.spyOn(gameModel, 'find').mockRejectedValue('');
        await expect(service.deleteAllGames()).rejects.toEqual('Failed to delete all games: ');
    });

    it('deleteBestTimes should reset to default values bestTimes of every games', async () => {
        jest.spyOn(gameImageService, 'getMatrix').mockImplementation(async () => Promise.resolve([]));
        await gameModel.deleteMany({});
        const game1 = getFakeGame();
        const game2 = getFakeGame2();
        game1.soloBestTimes = [
            { name: 'newBest', time: 1 },
            { name: 'secondBest', time: 3 },
            { name: 'Joueur 3', time: 180 },
        ];
        game2.soloBestTimes = [
            { name: 'newBest', time: 3 },
            { name: 'secondBest', time: 5 },
            { name: 'Joueur 3', time: 180 },
        ];
        game1.vsBestTimes = [
            { name: 'newBest', time: 1 },
            { name: 'Joueur 2', time: 120 },
            { name: 'Joueur 3', time: 180 },
        ];
        await gameModel.create(game1);
        await gameModel.create(game2);
        await service.deleteBestTimes();
        await new Promise((resolve) => setTimeout(resolve, timeoutTime));
        const gamesUpdated = await service.getAllGames();
        expect(gamesUpdated[0].soloBestTimes).toEqual(newBestTimes());
        expect(gamesUpdated[1].soloBestTimes).toEqual(newBestTimes());
        expect(gamesUpdated[0].vsBestTimes).toEqual(newBestTimes());
        expect(gamesUpdated[1].vsBestTimes).toEqual(newBestTimes());
    });

    it('deleteBestTimes should fail if update fails', async () => {
        jest.spyOn(gameModel, 'find').mockRejectedValue('');
        await expect(service.deleteBestTimes()).rejects.toEqual('Failed to delete all best times: ');
    });

    it('deleteBestTime should reset to default values bestTimes of specified game', async () => {
        await gameModel.deleteMany({});
        const game1 = getFakeGame();
        const game2 = getFakeGame2();
        game1.soloBestTimes = [
            { name: 'newBest', time: 1 },
            { name: 'secondBest', time: 3 },
            { name: 'Joueur 3', time: 180 },
        ];
        game2.soloBestTimes = [
            { name: 'newBest', time: 3 },
            { name: 'secondBest', time: 5 },
            { name: 'Joueur 3', time: 180 },
        ];
        game1.vsBestTimes = [
            { name: 'newBest', time: 1 },
            { name: 'Joueur 2', time: 120 },
            { name: 'Joueur 3', time: 180 },
        ];
        await gameModel.create(game1);
        await gameModel.create(game2);
        await service.deleteBestTime(game1.name);
        const gamesUpdated = await gameModel.find();
        expect(gamesUpdated[0].soloBestTimes).toEqual(newBestTimes());
        expect(gamesUpdated[1].soloBestTimes).toEqual([
            { name: 'newBest', time: 3 },
            { name: 'secondBest', time: 5 },
            { name: 'Joueur 3', time: 180 },
        ]);
        expect(gamesUpdated[0].vsBestTimes).toEqual(newBestTimes());
    });

    it('deleteBestTime should fail if update fails', async () => {
        jest.spyOn(gameModel, 'findOne').mockRejectedValue('');
        await expect(service.deleteBestTime('404')).rejects.toEqual('Failed to delete best time: ');
    });

    it('updateBestTime should add new bestTime to specified game if its an actual new best and send a new message', async () => {
        jest.spyOn(chatGateway, 'newBestTimeScore').mockImplementation();
        await gameModel.deleteMany({});
        const game = getFakeGame();
        await gameModel.create(game);
        const position = await service.updateBestTime(game.name, newFakeBestTime());
        const gameUpdated = await gameModel.findOne({ name: game.name });
        expect(gameUpdated.soloBestTimes).toEqual([
            { name: 'newBest', time: 1 },
            { name: 'Joueur 1', time: 60 },
            { name: 'Joueur 2', time: 120 },
        ]);
        expect(gameUpdated.vsBestTimes).toEqual(game.vsBestTimes);
        expect(chatGateway.newBestTimeScore).toHaveBeenCalledWith(
            'newBest obtient la 1ere place dans les meilleurs temps du jeu FakeGame en mode solo',
        );
        expect(position).toEqual(0);
    });

    it('updateBestTime should add new bestTime to specified game if its an actual new best and send a new message', async () => {
        jest.spyOn(chatGateway, 'newBestTimeScore').mockImplementation();
        await gameModel.deleteMany({});
        const game = getFakeGame();
        await gameModel.create(game);
        const newBestTime = newFakeBestTime();
        newBestTime.isSolo = false;
        newBestTime.time = 64;
        const position = await service.updateBestTime(game.name, newBestTime);
        const gameUpdated = await gameModel.findOne({ name: game.name });
        expect(gameUpdated.vsBestTimes).toEqual([
            { name: 'Joueur 1', time: 60 },
            { name: 'newBest', time: 64 },
            { name: 'Joueur 2', time: 120 },
        ]);
        expect(gameUpdated.soloBestTimes).toEqual(game.soloBestTimes);
        expect(chatGateway.newBestTimeScore).toHaveBeenCalledWith(
            'newBest obtient la 2eme place dans les meilleurs temps du jeu FakeGame en mode un contre un',
        );
        expect(position).toEqual(1);
    });

    it('updateBestTime should not add new time if its not a new best score for the game', async () => {
        jest.spyOn(chatGateway, 'newBestTimeScore').mockImplementation();
        await gameModel.deleteMany({});
        const game = getFakeGame();
        await gameModel.create(game);
        const newBestTime = newFakeBestTime();
        newBestTime.isSolo = false;
        newBestTime.time = 50000;
        const position = await service.updateBestTime(game.name, newBestTime);
        const gameUpdated = await gameModel.findOne({ name: game.name });
        expect(gameUpdated.vsBestTimes).toEqual(game.vsBestTimes);
        expect(gameUpdated.soloBestTimes).toEqual(game.soloBestTimes);
        expect(chatGateway.newBestTimeScore).not.toHaveBeenCalled();
        expect(position).toEqual(NOT_TOP3);
    });

    it('updateBestTime should throw an error if game is not found', async () => {
        jest.spyOn(gameModel, 'findOne').mockRejectedValue('');
        await expect(service.updateBestTime('404', newFakeBestTime())).rejects.toEqual('Failed to update best time: ');
    });

    it('updateBestTime should throw an error if game is undefined', async () => {
        jest.spyOn(gameModel, 'findOne').mockReturnValue(undefined);
        await expect(service.updateBestTime('404', newFakeBestTime())).rejects.toEqual('Could not find game');
    });

    it('BestTime should return an array of type BestTime', () => {
        const game = getFakeGame();
        expect(game.soloBestTimes).toBeInstanceOf(Array);
    });
});

const getFakeGame = (): Game => ({
    name: 'FakeGame',
    nbDifference: 5,
    creator: 'fake',
    isDeleted: false,
    wantShoutout: false,
    difficulty: 'facile',
    soloBestTimes: newBestTimes(),
    vsBestTimes: newBestTimes(),
});

const getFakeGame2 = (): Game => ({
    name: 'FakeGame',
    nbDifference: 8,
    creator: 'fake',
    wantShoutout: false,
    isDeleted: false,
    difficulty: 'difficile',
    soloBestTimes: newBestTimes(),
    vsBestTimes: newBestTimes(),
});

const getFakeGameData = (): GameData => ({
    differenceMatrix: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ],
    creator: 'fake',
    wantShoutout: false,
    name: 'FakeGame',
    differenceHashMap: [],
    nbDifference: 5,
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

const newFakeBestTime = (): NewBestTime => ({ name: 'newBest', time: 1, gameName: 'FakeGame', isSolo: true });
