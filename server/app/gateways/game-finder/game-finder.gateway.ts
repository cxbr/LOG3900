import { GameFinderEvents } from '@common/enums/game-finder.gateway.variables';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { GameMode } from '@common/game-mode';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameFinderGateway {
    @WebSocketServer() private server: Server;

    constructor(private readonly logger: Logger, private readonly gameModeService: GameModeService) {}

    @SubscribeMessage(GameFinderEvents.CheckGame)
    checkIfGameExists(socket: Socket, data: { gameName: string; gameMode: string }): void {
        const gameRoom = this.gameModeService.getGameRoom(undefined, data.gameName, data.gameMode);
        if (gameRoom) {
            if (gameRoom.started) return;
            if (data.gameMode === GameMode.classicMode) {
                this.logger.log(`Game finder gateway: Game ${data.gameName} found`);
            } else {
                this.logger.log('Game finder gateway: Limited time game found');
            }
            this.server.to(socket.id).emit(GameFinderEvents.GameFound, { gameName: data.gameName, gameMode: data.gameMode });
        } else {
            this.logger.log(`Game finder gateway: No game ${data.gameName} found`);
        }
    }

    @SubscribeMessage(GameFinderEvents.GetGames)
    getGames(socket: Socket, data: { gameMode: string; gameName: string }): void {
        this.logger.log(`Game finder gateway: check game ${data.gameName} in ${data.gameMode}`);
        const games = this.gameModeService.getGames(data.gameName, data.gameMode);
        this.logger.log(`Game finder gateway: ${games.length} games found`);
        this.server.to(socket.id).emit(GameFinderEvents.Games, { games, gameName: data.gameName, gameMode: data.gameMode });
    }

    @SubscribeMessage(GameFinderEvents.AskToJoinGame)
    checkIfUserCanJoinGame(socket: Socket, data: { gameName: string; username: string; gameMode: string }): void {
        if (this.gameModeService.canJoinGame(data)) {
            this.logger.log(`Game finder gateway: ${data.username} can join the game`);
            this.server.to(socket.id).emit(GameFinderEvents.CanJoinGame);
        } else {
            this.logger.log(`Game finder gateway: ${data.username} cannot join the game`);
            this.server.to(socket.id).emit(GameFinderEvents.CannotJoinGame);
        }
    }
}
