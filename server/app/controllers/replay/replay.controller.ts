import { NewReplay } from '@app/model/dto/replay/replay';
import { ReplayService } from '@app/services/replay/replay.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';

import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Replay')
@Controller('replay')
export class ReplayController {
    constructor(private readonly replayService: ReplayService) {}

    @ApiOkResponse({
        description: 'Returns all replays',
        isArray: true,
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to get all replays' })
    @Get('/')
    async getAllReplays(@Res() response: Response) {
        try {
            const allReplays = await this.replayService.getAllReplays();
            response.status(HttpStatus.OK).json(allReplays);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Replay found',
        isArray: false,
    })
    @ApiNotFoundResponse({
        description: 'Replay not found',
    })
    @Get('/:replayId')
    async getReplayById(@Res() response: Response, @Param('replayId') replayId) {
        try {
            const replay = await this.replayService.getReplayById(replayId);
            response.status(HttpStatus.OK).json(replay);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Replay created',
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to create replay' })
    @Post('/')
    async createReplay(@Body() newReplay: NewReplay, @Res() response: Response) {
        try {
            await this.replayService.createReplay(newReplay);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Replay updated',
    })
    @ApiNotFoundResponse({
        description: 'Replay not found',
    })
    @Put('/')
    async updateReplay(@Res() response: Response, @Body() replay) {
        try {
            await this.replayService.updateReplay(replay);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Deletes a replay',
    })
    @ApiNotFoundResponse({
        description: 'Replay not found',
    })
    @Delete('/:replayId')
    async deleteReplay(@Res() response: Response, @Param('replayId') replayId) {
        try {
            await this.replayService.deleteReplay(replayId);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Deletes all replays created by a user',
    })
    @ApiNotFoundResponse({
        description: 'User replays not found',
    })
    @Delete('/user/:userId')
    async deleteReplaysByUserId(@Res() response: Response, @Param('userId') userId) {
        try {
            await this.replayService.deleteReplaysByUserId(userId);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Deletes all replays',
    })
    @ApiInternalServerErrorResponse({ description: 'Failed to delete all replays' })
    @Delete('/')
    async deleteAllReplays(@Res() response: Response) {
        try {
            await this.replayService.deleteAllReplays();
            response.status(HttpStatus.OK).send();
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
