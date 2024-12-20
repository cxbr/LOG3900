import { DELAY_BEFORE_CLOSING_CONNECTION } from '@app/constants/constants';
import { GameConstants, GameConstantsDocument, gameConstantsSchema } from '@app/model/database/game-constants';
import { GameConstantsService } from '@app/services/game-constants/game-constants.service';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';

describe('GameConstantsService', () => {
    let service: GameConstantsService;
    let gameConstantsModel: Model<GameConstantsDocument>;
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
                MongooseModule.forFeature([{ name: 'game-constants', schema: gameConstantsSchema }]),
            ],
            providers: [GameConstantsService],
        }).compile();

        service = module.get<GameConstantsService>(GameConstantsService);
        gameConstantsModel = module.get<Model<GameConstantsDocument>>(getModelToken('game-constants'));
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
        expect(gameConstantsModel).toBeDefined();
    });

    it('should return the game constants', async () => {
        await gameConstantsModel.deleteMany({});
        await gameConstantsModel.create(getInitConstants());
        const gameConstants = await service.getGameConstants();
        expect(gameConstants).toBeDefined();
        expect(gameConstants.gameDuration).toEqual(getInitConstants().gameDuration);
        expect(gameConstants.penaltyTime).toEqual(getInitConstants().penaltyTime);
        expect(gameConstants.bonusTime).toEqual(getInitConstants().bonusTime);
    });

    it('initiateGameConstants should create constants in database if not already created', async () => {
        await gameConstantsModel.deleteMany({});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (service as any).initiateGameConstants();
        const gameConst = await service.getGameConstants();
        expect(gameConst).toBeDefined();
        expect(gameConst.gameDuration).toEqual(getInitConstants().gameDuration);
        expect(gameConst.penaltyTime).toEqual(getInitConstants().penaltyTime);
        expect(gameConst.bonusTime).toEqual(getInitConstants().bonusTime);
    });

    it('initiateGameConstants should not create new constants in database if already present', async () => {
        await gameConstantsModel.deleteMany({});
        const gameConstants = getInitConstants();
        gameConstants.gameDuration = 30;
        await gameConstantsModel.create(gameConstants);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (service as any).initiateGameConstants();
        const afterInitGameConst = await gameConstantsModel.findOne({});
        expect(afterInitGameConst.gameDuration).toEqual(gameConstants.gameDuration);
    });

    it('should update the game constants', async () => {
        await gameConstantsModel.deleteMany({});
        await gameConstantsModel.create(getInitConstants());
        const gameConstants = await service.getGameConstants();
        expect(gameConstants).toBeDefined();
        const newGameConstants = {
            gameDuration: 10,
            penaltyTime: 10,
            bonusTime: 10,
        };
        await service.updateGameConstants(newGameConstants);
        const updatedGameConstants = await service.getGameConstants();
        expect(updatedGameConstants).toBeDefined();
        expect(updatedGameConstants.gameDuration).toEqual(newGameConstants.gameDuration);
        expect(updatedGameConstants.penaltyTime).toEqual(newGameConstants.penaltyTime);
        expect(updatedGameConstants.bonusTime).toEqual(newGameConstants.bonusTime);
    });
});

const getInitConstants = (): GameConstants => ({
    gameDuration: 30,
    penaltyTime: 5,
    bonusTime: 5,
});
