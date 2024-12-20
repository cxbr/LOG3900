import { GameController } from '@app/controllers/game/game.controller';
import { NewGame } from '@app/model/dto/game/new-game.dto';
import { GameService } from '@app/services/game/game.service';
import { GameImageService } from '@app/services/image/game-image.service';
import { RatingService } from '@app/services/rating/rating.service';
import { GameData } from '@common/classes/game-data';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

describe.only('GameController', () => {
    let controller: GameController;
    let gameService: SinonStubbedInstance<GameService>;
    let gameImageService: SinonStubbedInstance<GameImageService>;
    let ratingService: SinonStubbedInstance<RatingService>;

    beforeEach(async () => {
        gameService = createStubInstance(GameService);
        gameImageService = createStubInstance(GameImageService);
        ratingService = createStubInstance(RatingService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GameController],
            providers: [
                {
                    provide: GameService,
                    useValue: gameService,
                },
                {
                    provide: GameImageService,
                    useValue: gameImageService,
                },
                {
                    provide: RatingService,
                    useValue: ratingService,
                },
            ],
        }).compile();

        controller = module.get<GameController>(GameController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getAllGames should return all games and return status code OK', async () => {
        const fakeGames = [new GameData(), new GameData()];
        gameService.getAllGames.resolves(fakeGames);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (games) => {
            expect(games).toEqual(fakeGames);
            return res;
        };

        await controller.getAllGames(res);
    });

    it('getAllGames should return INTERNAL_SERVER_ERROR when service unable to fetch games', async () => {
        gameService.getAllGames.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.getAllGames(res);
    });

    it('getGameByName should return the game in question and return status code OK', async () => {
        const fakeGameData = new GameData();
        gameService.getGame.resolves(fakeGameData);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (games) => {
            expect(games).toEqual(fakeGameData);
            return res;
        };

        await controller.getGameByName('', res);
    });

    it('getGameByName should return NOT_FOUND when service unable to fetch the game', async () => {
        gameService.getGame.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.getGameByName('', res);
    });

    it('createNewGame should return CREATED when service successfully creates a new game', async () => {
        const fakeNewGame = new NewGame();
        gameService.createNewGame.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.CREATED);
            return res;
        };
        res.send = () => res;

        await controller.createNewGame(fakeNewGame, res);
    });

    it('createNewGame should return INTERNAL_SERVER_ERROR when service unable to create a new game', async () => {
        const fakeNewGame = new NewGame();
        gameService.createNewGame.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.createNewGame(fakeNewGame, res);
    });

    it('deleteGame should return OK when service successfully deletes a game', async () => {
        gameService.deleteGame.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteGame('', res);
    });

    it('deleteGame should return NOT_FOUND when service unable to delete a game', async () => {
        gameService.deleteGame.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.deleteGame('', res);
    });

    it('deleteAllGames should return OK when service successfully delete all games', async () => {
        gameService.deleteAllGames.resolves();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllGames(res);
    });

    it('deleteAllGames should return INTERNAL_SERVER_ERROR when service unable to delete all games', async () => {
        gameService.deleteAllGames.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            return res;
        };
        res.send = () => res;

        await controller.deleteAllGames(res);
    });
});
