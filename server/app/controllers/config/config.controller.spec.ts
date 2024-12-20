import { ConfigController } from '@app/controllers/config/config.controller';
import { GameConstants } from '@app/model/dto/game-constants/game-constants.dto';
import { GameHistory } from '@app/model/dto/game-history/game-history.dto';
import { NewBestTime } from '@app/model/dto/game/new-best-time.dto';
import { GameConstantsService } from '@app/services/game-constants/game-constants.service';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { GameService } from '@app/services/game/game.service';
import { BestTime } from '@common/classes/best-time';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

describe.only('ConfigController', () => {
    let controller: ConfigController;
    let gameService: SinonStubbedInstance<GameService>;
    let gameHistoryService: SinonStubbedInstance<GameHistoryService>;
    let gameConstantsService: SinonStubbedInstance<GameConstantsService>;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        gameHistoryService = createStubInstance(GameHistoryService);
        gameConstantsService = createStubInstance(GameConstantsService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ConfigController],
            providers: [
                {
                    provide: GameService,
                    useValue: gameService,
                },
                {
                    provide: GameHistoryService,
                    useValue: gameHistoryService,
                },
                {
                    provide: GameConstantsService,
                    useValue: gameConstantsService,
                },
            ],
        }).compile();

        controller = module.get<ConfigController>(ConfigController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getAllHistory should return all history', async () => {
        const fakeHistories = [new GameHistory(), new GameHistory()];
        gameHistoryService.getGamesHistories.resolves(fakeHistories);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (histories) => {
            expect(histories).toEqual(fakeHistories);
            return res;
        };

        await controller.getAllHistories(res);
    });

    it('getAllHistory should return INTERNAL_SERVER_ERROR when service unable to fetch history', async () => {
        gameHistoryService.getGamesHistories.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.getAllHistories(res);
    });

    it('getConstants should return the game constants with status code OK', async () => {
        const fakeConstants = getFakeGameConstants();
        gameConstantsService.getGameConstants.resolves(fakeConstants);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (constants) => {
            expect(constants).toEqual(fakeConstants);
            return res;
        };

        await controller.getConstants(res);
    });

    it('getConstants should return NOT_FOUND when service unable to fetch constants', async () => {
        gameConstantsService.getGameConstants.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.getConstants(res);
    });

    it('getBestTime should return the bestTime of specific game with status code OK', async () => {
        const fakeBestTimes = { soloBestTimes: [new BestTime(), new BestTime()], vsBestTimes: [new BestTime(), new BestTime()] };
        gameService.getBestTime.resolves(fakeBestTimes);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (time) => {
            expect(time).toEqual(fakeBestTimes);
            return res;
        };

        await controller.getBestTime('', res);
    });

    it('getBestTime should return NOT_FOUND when service unable to fetch bestTimes for specific game', async () => {
        gameService.getBestTime.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.getBestTime('', res);
    });

    it('updateBestTime should modify the bestTime of specific game and return CREATED', async () => {
        gameService.updateBestTime.resolves(0);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.json = (position) => {
            expect(position).toEqual(0);
            return res;
        };
        res.send = () => res;

        await controller.updateBestTime('', new NewBestTime(), res);
    });

    it('updateBestTime should return NOT_FOUND when service unable to update bestTimes for specific game', async () => {
        gameService.updateBestTime.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.updateBestTime('', new NewBestTime(), res);
    });

    it('updateConstants should modify the game constants and return NO_CONTENT', async () => {
        gameConstantsService.updateGameConstants.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NO_CONTENT);
            return res;
        };
        res.send = () => res;

        await controller.updateConstants(new GameConstants(), res);
    });

    it('updateConstants should return INTERNAL_SERVER_ERROR when service unable to update constants', async () => {
        gameConstantsService.updateGameConstants.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.updateConstants(new GameConstants(), res);
    });

    it('deleteAllHistory should delete all history and return OK', async () => {
        gameHistoryService.deleteGamesHistories.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllHistories(res);
    });

    it('deleteAllHistory should return INTERNAL_SERVER_ERROR when service unable to delete history', async () => {
        gameHistoryService.deleteGamesHistories.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllHistories(res);
    });

    it('deleteBestTimes should delete all bestTimes and return OK', async () => {
        gameService.deleteBestTimes.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllBestTimes(res);
    });

    it('deleteBestTimes should return INTERNAL_SERVER_ERROR when service unable to delete bestTimes', async () => {
        gameService.deleteBestTimes.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllBestTimes(res);
    });

    it('deleteBestTime should delete the bestTime of specific game and return OK', async () => {
        gameService.deleteBestTimes.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteBestTime('', res);
    });

    it('deleteBestTime should return NOT_FOUND when service unable to delete bestTimes for specific game', async () => {
        gameService.deleteBestTimes.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.deleteBestTime('', res);
    });
});

const getFakeGameConstants = (): GameConstants => ({
    gameDuration: 30,
    penaltyTime: 5,
    bonusTime: 5,
});
