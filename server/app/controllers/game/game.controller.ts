import { NewGame } from '@app/model/dto/game/new-game.dto';
import { NewName } from '@app/model/dto/game/new-name.dto';
import { GameService } from '@app/services/game/game.service';
import { GameImageService } from '@app/services/image/game-image.service';
import { RatingService } from '@app/services/rating/rating.service';
import { GameData } from '@common/classes/game-data';
import { GameRating } from '@common/classes/game-rating';
import { RatingFormat } from '@common/classes/rating-format';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Game')
@Controller('game')
export class GameController {
    constructor(
        private readonly gameService: GameService,
        private readonly gameImageService: GameImageService,
        private ratingService: RatingService,
    ) {}

    @ApiOkResponse({
        description: 'Returns all games',
        type: GameData,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/')
    async getAllGames(@Res() response: Response) {
        try {
            const allGames = await this.gameService.getAllGames();
            for (let i = 0; i < allGames.length; i++) {
                const game = allGames[i];
                if (!(await this.gameImageService.imagesExist(game.name)) || !(await this.gameImageService.diffImageExist(game.name))) {
                    allGames.splice(i, 1);
                    i--;
                }
            }
            response.status(HttpStatus.OK).json(allGames);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
    @Get('/gameReviews/:gameName')
    async getGameReview(@Res() response: Response, @Param('gameName') gameName: string) {
        try {
            const ratingInfo: GameRating = this.ratingService.getAverageReview(gameName);
            response.status(HttpStatus.OK).json(ratingInfo);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
    @Post('/rating')
    async saveReview(@Body() ratingData: RatingFormat, @Res() response: Response) {
        this.ratingService.saveReviewInFile(ratingData);
        try {
            response.status(HttpStatus.CREATED).send({ message: 'Rating received and saved successfully' });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Error saving rating data' });
        }
    }

    @ApiOkResponse({
        description: 'Get game by name',
        type: GameData,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Get('/:name')
    async getGameByName(@Param('name') name: string, @Res() response: Response) {
        try {
            const game = await this.gameService.getGame(name);
            response.status(HttpStatus.OK).json(game);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new game',
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Post('/')
    async createNewGame(@Body() newGame: NewGame, @Res() response: Response) {
        try {
            await this.gameService.createNewGame(newGame);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'renamed game',
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Put('/')
    async renameGame(@Body() newName: NewName, @Res() response: Response) {
        try {
            await this.gameService.renameGame(newName);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Delete a game',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Delete('/:name')
    async deleteGame(@Param('name') name: string, @Res() response: Response) {
        try {
            await this.gameService.deleteGame(name);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Delete all games',
    })
    @ApiNotFoundResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when request fails',
    })
    @Delete('/')
    async deleteAllGames(@Res() response: Response) {
        try {
            await this.gameService.deleteAllGames();
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
