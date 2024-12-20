import { DELAY_BETWEEN_EMISSIONS } from '@app/constants/constants';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Vector2D } from '@app/model/schema/vector2d.schema';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { UserService } from '@app/services/user/user.service';
import { GameRoom } from '@common/classes/game-room';
import { GameFinderEvents } from '@common/enums/game-finder.gateway.variables';
import { GameModeEvents } from '@common/enums/game-mode.gateway.variables';
import { WaitingRoomEvents } from '@common/enums/waiting-room.gateway.variables';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class GameModeGateway implements OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() private server: Server;

    constructor(
        private readonly logger: Logger,
        private readonly gameModeService: GameModeService,
        private readonly userService: UserService,
        private readonly chatGateway: ChatGateway,
    ) {}

    @SubscribeMessage(GameModeEvents.ValidateDifference)
    async validateDifference(socket: Socket, data: { differencePos: Vector2D; roomId: string; username: string; validated: boolean }): Promise<void> {
        const gameRoom: GameRoom = this.gameModeService.getGameRoom(data.roomId);
        const validated = this.gameModeService.validateDifference(data.roomId, data.differencePos, data.username, data.validated);
        this.server.to(data.roomId).emit(GameModeEvents.DifferenceValidated, {
            validated,
            differencePos: data.differencePos,
            username: data.username,
            everyoneScore: gameRoom.userGame.differenceFoundByPlayers,
        });
    }

    @SubscribeMessage(GameModeEvents.SendDifference)
    sendDifference(socket: Socket, data: { differenceMatrix: number[][]; roomId: string }): void {
        this.gameModeService.updateGameMatrix(data.differenceMatrix, data.roomId);
    }

    @SubscribeMessage(GameModeEvents.Hint)
    hint(socket: Socket, data: { imageData: string; sender: string; receiver: string; roomId: string; left: boolean }): void {
        this.server.to(data.roomId).emit(GameModeEvents.Hint, {
            imageData: data.imageData,
            sender: data.sender,
            receiver: data.receiver,
            left: data.left,
        });
    }

    @SubscribeMessage(GameModeEvents.CheatMode)
    cheatMode(socket: Socket, roomId: string): void {
        const gameRoom = this.gameModeService.getGameRoom(roomId);
        if (gameRoom && !gameRoom.gameConstants.cheatMode) {
            this.logger.log(`Game mode gateway: ${socket.id} trying to cheat but he can't`);
            this.server.to(socket.id).emit(GameModeEvents.CheatMode, false);
        } else if (gameRoom && gameRoom.gameConstants.cheatMode) {
            this.logger.log(`Game mode gateway: ${socket.id} cheated`);
            this.server.to(socket.id).emit(GameModeEvents.CheatMode, true);
        }
    }

    @SubscribeMessage(GameModeEvents.ObserverLeaveGame)
    observerLeaveGame(socket: Socket, data: { roomId: string; username: string }): void {
        const gameRoom = this.gameModeService.getGameRoom(data.roomId);
        if (!gameRoom) return;
        this.gameModeService.removeObserver(gameRoom, data.username);
        this.logger.log(`Game mode gateway: observer ${data.username}: left the game`);
        this.server.to(data.roomId).emit(WaitingRoomEvents.ObservingGame, gameRoom);
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });
        this.chatGateway.unsubscribeFromChannel(socket, { channelId: gameRoom.roomId, username: data.username });
    }

    @SubscribeMessage(GameModeEvents.EndGame)
    endGame(_socket: Socket, roomId: string): void {
        const gameRoom = this.gameModeService.getGameRoom(roomId);
        if (!gameRoom) return;
        this.logger.log(`Game mode gateway: End of game: ${gameRoom.userGame.gameName}`);
        this.server.to(roomId).emit(GameModeEvents.GameFinished);
        const endGame = this.gameModeService.endGame(gameRoom);
        this.server.to(gameRoom.roomId).emit(GameModeEvents.GameFinished, endGame);
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });
    }

    @SubscribeMessage(GameModeEvents.Abandoned)
    abandoned(socket: Socket, data: { roomId: string; username: string }): void {
        const gameRoom = this.gameModeService.getGameRoom(data.roomId);
        if (!gameRoom) return;
        if (gameRoom.userGame.observers?.some((observer) => observer.username === data.username)) return;
        this.gameModeService.abandonGame(socket, gameRoom, data.username);
        this.logger.log(`Game mode gateway: ${data.username}: abandoned ${gameRoom.gameMode}`);
        this.server.to(data.roomId).emit(GameModeEvents.Abandoned, { gameRoom, username: data.username });
        if (gameRoom.userGame.currentPlayers.length === 0) {
            this.logger.log(`Game deleted: ${gameRoom.userGame.gameName}`);
            this.server.emit(GameModeEvents.GameDeleted, { gameName: gameRoom.userGame.gameName, gameMode: gameRoom.gameMode });
            this.gameModeService.deleteGameRoom(gameRoom.roomId);
        }
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });
    }

    @SubscribeMessage(GameModeEvents.ChangeTime)
    changeTime(_socket: Socket, data: { roomId: string; time: number }): void {
        this.logger.log(`Game mode gateway: Time changed: ${data.time}`);
        this.gameModeService.applyTimeToTimer(data.roomId, data.time);
    }

    @SubscribeMessage(GameModeEvents.NextGame)
    async loadNextGame(_socket: Socket, gameRoom: GameRoom): Promise<void> {
        await this.gameModeService.refreshRoomGame(gameRoom);
        this.logger.log(`Game mode gateway: Next game loaded: ${gameRoom.userGame.gameName}`);
        this.server.to(gameRoom.roomId).emit(GameModeEvents.NextGame, gameRoom);
    }

    afterInit(): void {
        setInterval(() => {
            this.emitTime();
        }, DELAY_BETWEEN_EMISSIONS);
    }

    handleDisconnect(socket: Socket): void {
        const username = this.userService.getUsernameBySocketId(socket.id);
        const gameRoom = this.gameModeService.findGameRoomByUsername(username);
        if (!gameRoom || !gameRoom.started) return;
        this.logger.log(`Game mode gateway: ${socket.id} | ${username}: disconnected`);
        if (gameRoom.userGame.observers?.some((observer) => observer.username === username)) {
            this.observerLeaveGame(socket, { roomId: gameRoom.roomId, username });
            return;
        }
        this.abandoned(socket, { roomId: gameRoom.roomId, username });
    }

    emitTime(): void {
        for (const gameRoom of this.gameModeService.getRoomsValues()) {
            if (gameRoom.started) {
                this.gameModeService.updateTimer(gameRoom);
                this.server.to(gameRoom.roomId).emit(GameModeEvents.Timer, gameRoom.userGame.timer);
                if (this.gameModeService.isGameFinished(gameRoom)) {
                    const endGame = this.gameModeService.endGame(gameRoom);
                    this.server.to(gameRoom.roomId).emit(GameModeEvents.GameFinished, endGame);
                    this.server.emit(GameFinderEvents.Games, {
                        games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
                        gameName: gameRoom.userGame.gameName,
                        gameMode: gameRoom.gameMode,
                    });
                }
            }
        }
    }

    cancelDeletedGame(gameName: string): void {
        this.logger.log(`Game mode gateway: Game canceled: ${gameName}`);
        this.server.emit(GameModeEvents.GameDeleted, gameName);
        this.server.emit(GameModeEvents.GameDeletedFromDB, gameName);
    }

    sleep = async (ms: number) => new Promise((r) => setTimeout(r, ms));
}
