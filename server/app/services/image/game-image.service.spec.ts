/* eslint-disable max-lines */
import { Game } from '@app/model/database/game';
import { GameImageService } from '@app/services/image/game-image.service';
import { ImageService } from '@app/services/image/image.service';
import { BestTime } from '@common/classes/best-time';
import { Test } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

describe('GameService', () => {
    let service: GameImageService;
    let imageService: SinonStubbedInstance<ImageService>;

    beforeEach(async () => {
        imageService = createStubInstance(ImageService);
        const module = await Test.createTestingModule({
            providers: [
                GameImageService,
                {
                    provide: ImageService,
                    useValue: imageService,
                },
            ],
        }).compile();

        service = module.get<GameImageService>(GameImageService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('BestTime should return an array of type BestTime', () => {
        const game = getFakeGame();
        expect(game.soloBestTimes).toBeInstanceOf(Array);
    });
});

const getFakeGame = (): Game => ({
    name: 'FakeGame',
    nbDifference: 5,
    difficulty: 'facile',
    creator: 'fake',
    wantShoutout: false,
    isDeleted: false,
    soloBestTimes: newBestTimes(),
    vsBestTimes: newBestTimes(),
});

const newBestTimes = (): BestTime[] => [
    { name: 'Joueur 1', time: 60 },
    { name: 'Joueur 2', time: 120 },
    { name: 'Joueur 3', time: 180 },
];
