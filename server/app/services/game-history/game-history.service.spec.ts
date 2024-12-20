import { DELAY_BEFORE_CLOSING_CONNECTION } from '@app/constants/constants';
import { gameHistorySchema, HistoryDocument } from '@app/model/database/game-history';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';

describe('GameHistoryService', () => {
    let service: GameHistoryService;
    let gameHistoryModel: Model<HistoryDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;
    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                    imports: undefined,
                }),
                MongooseModule.forFeature([{ name: 'games-histories', schema: gameHistorySchema }]),
            ],
            providers: [GameHistoryService],
        }).compile();

        service = module.get<GameHistoryService>(GameHistoryService);
        gameHistoryModel = module.get<Model<HistoryDocument>>(getModelToken('games-histories'));
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
        expect(gameHistoryModel).toBeDefined();
    });

    // it('getGamesHistories should return the game constants', async () => {
    //     await gameHistoryModel.deleteMany({});
    //     await gameHistoryModel.create(getFakeGameHistory());
    //     await gameHistoryModel.create(getFakeGameHistory2());
    //     const gameHistories = await service.getGamesHistories();
    //     expect(gameHistories.length).toEqual(2);
    //     expect(gameHistories[0].name).toEqual(getFakeGameHistory().name);
    //     expect(gameHistories[1].name).toEqual(getFakeGameHistory2().name);
    // });

    // it('saveGameHistory should save the game history in database', async () => {
    //     await gameHistoryModel.deleteMany({});
    //     await service.saveGameHistory(getFakeGameHistory());
    //     const gameHistories = await service.getGamesHistories();
    //     expect(gameHistories.length).toEqual(1);
    //     expect(gameHistories[0].name).toEqual(getFakeGameHistory().name);
    // });

    // it('saveGameHistory should have rejected if cannot create new gameHistory', async () => {
    //     jest.spyOn(gameHistoryModel, 'create').mockImplementation(async () => Promise.reject(''));
    //     await gameHistoryModel.deleteMany({});
    //     await expect(service.saveGameHistory(getFakeGameHistory())).rejects.toBeTruthy();
    // });

    // it('deleteGamesHistories should delete all game histories in database', async () => {
    //     await gameHistoryModel.deleteMany({});
    //     await gameHistoryModel.create(getFakeGameHistory());
    //     await gameHistoryModel.create(getFakeGameHistory2());
    //     await service.deleteGamesHistories();
    //     const gameHistories = await service.getGamesHistories();
    //     expect(gameHistories.length).toEqual(0);
    // });

    // it('deleteGamesHistories should have rejected if cannot delete', async () => {
    //     jest.spyOn(gameHistoryModel, 'deleteMany').mockRejectedValue('');
    //     try {
    //         await service.deleteGamesHistories();
    //     } catch (e) {
    //         expect(e).toBeTruthy();
    //     }
    // });
});

// const getFakeGameHistory = (): GameHistory => ({
//     name: 'FakeHistory',
//     startTime: 0,
//     timer: 4500,
//     players: ['FakeUser1'],
//     _id: 'FakeId',
//     gameMode: 'solo',
//     abandoned: undefined,
//     winner: 'FakeUser1',
//     deletedByUsers: undefined,
// });

// const getFakeGameHistory2 = (): GameHistory => ({
//     name: 'FakeHistory2',
//     startTime: 0,
//     timer: 380,
//     players: ['FakeUser1', 'FakeUser2'],
//     _id: 'FakeId',
//     gameMode: 'vs',
//     abandoned: undefined,
//     winner: 'FakeUser2',
//     deletedByUsers: undefined,
// });
