import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameModeService } from '@app/services/game-mode/game-mode.service';
import { UserService } from '@app/services/user/user.service';
import { GameRoom } from '@common/classes/game-room';
import { CurrentPlayer } from '@common/classes/user-game';
import { GameFinderEvents } from '@common/enums/game-finder.gateway.variables';
import { WaitingRoomEvents } from '@common/enums/waiting-room.gateway.variables';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class WaitingRoomGateway implements OnGatewayDisconnect {
    @WebSocketServer() private server: Server;
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-magic-numbers
    MAX_PLAYERS_PER_GAME: number = 4;

    constructor(
        private readonly logger: Logger,
        private readonly gameModeService: GameModeService,
        private readonly userService: UserService,
        private chatGateway: ChatGateway,
    ) {}

    @SubscribeMessage(WaitingRoomEvents.Start)
    startGame(_socket: Socket, roomId: string): void {
        const gameRoom = this.gameModeService.getGameRoom(roomId);
        gameRoom.started = true;
        this.gameModeService.saveGameHistory(gameRoom);
        this.logger.log(`Waiting room gateway: Launching the game: ${gameRoom.userGame.gameName}`);
        this.server.to(roomId).emit(WaitingRoomEvents.Started);
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });
    }

    @SubscribeMessage(WaitingRoomEvents.ObservingGame)
    observingGame(socket: Socket, gameRoom: GameRoom): void {
        this.logger.log(`Waiting room gateway: Observing game ${gameRoom.userGame.gameName}`);
        this.gameModeService.setGameRoom(gameRoom);
        this.server.to(gameRoom.roomId).emit(WaitingRoomEvents.ObservingGame, gameRoom);
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });
    }

    @SubscribeMessage(WaitingRoomEvents.StartingGame)
    startingGame(socket: Socket, gameRoom: GameRoom): void {
        this.logger.log(`Waiting room gateway: Starting game ${gameRoom.userGame.gameName}`);
        this.logger.log(`Waiting room gateway: Game constants: ${gameRoom.gameConstants.cheatMode} ${gameRoom.gameConstants.gameDuration}`);
        this.gameModeService.setGameRoom(gameRoom);
        this.server.to(gameRoom.roomId).emit(WaitingRoomEvents.StartingGame, gameRoom);
    }

    @SubscribeMessage(WaitingRoomEvents.CreateGame)
    async createGame(socket: Socket, gameRoom: GameRoom): Promise<void> {
        try {
            this.gameModeService.initNewRoom(socket, gameRoom);
            this.logger.log(`Waiting room gateway: Create the game: ${gameRoom.userGame.gameName}`);
            this.server.to(gameRoom.roomId).emit(WaitingRoomEvents.GameCreated, gameRoom.roomId);
            this.server.emit(GameFinderEvents.Games, {
                games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
                gameName: gameRoom.userGame.gameName,
                gameMode: gameRoom.gameMode,
            });

            this.chatGateway.createPrivateChannel(gameRoom.roomId, 'Canal de partie');
            await this.joinPrivateChatChannel(socket, gameRoom, gameRoom.userGame.creator);
            // Do it again just to be sure. I have no idea why it doesn't work the first time
            await this.joinPrivateChatChannel(socket, gameRoom, gameRoom.userGame.creator);
        } catch (error) {
            this.logger.error(`Waiting room gateway: Failed to create gameRoom ${gameRoom.userGame.gameName}`);
        }
    }

    @SubscribeMessage(WaitingRoomEvents.AskingToJoinGame)
    joinGame(socket: Socket, data: { gameName: string; user: CurrentPlayer; gameMode: string; roomId: string }): void {
        this.logger.log(`Waiting room gateway: ${data.user.username} is asking to join the game: ${data.gameName}`);
        if (this.gameModeService.joinGame(socket, data)) {
            const gameRoom = this.gameModeService.getGameRoom(data.roomId);
            this.logger.log(`Waiting room gateway: ${data.user.username} joined the game: ${gameRoom.userGame.gameName}`);
            this.server.emit(WaitingRoomEvents.GameInfo, gameRoom);
            this.server.emit(GameFinderEvents.Games, {
                games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
                gameName: gameRoom.userGame.gameName,
                gameMode: gameRoom.gameMode,
            });
            this.joinPrivateChatChannel(socket, gameRoom, data.user.username);
        } else {
            this.logger.log(`Waiting room gateway: Jeu: ${data.gameName} not found`);
            this.server.emit(WaitingRoomEvents.GameInfo, undefined);
        }
    }

    @SubscribeMessage(WaitingRoomEvents.AskingToObserveGame)
    observeGame(socket: Socket, data: { gameName: string; user: CurrentPlayer; gameMode: string; roomId: string }): void {
        this.logger.log(`Waiting room gateway: ${data.user.username} is asking to observe the game: ${data.gameName}`);
        if (this.gameModeService.observeGame(socket, data)) {
            const gameRoom = this.gameModeService.getGameRoom(data.roomId);
            this.logger.log(`Waiting room gateway: ${data.user.username} is observing the game: ${gameRoom.userGame.gameName}`);
            this.server.emit(WaitingRoomEvents.GameInfo, gameRoom);
            this.server.to(data.roomId).emit(WaitingRoomEvents.ObservingGame, gameRoom);
            this.server.emit(GameFinderEvents.Games, {
                games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
                gameName: gameRoom.userGame.gameName,
                gameMode: gameRoom.gameMode,
            });
            this.joinPrivateChatChannel(socket, gameRoom, data.user.username);
        } else {
            this.logger.log(`Waiting room gateway: Game: ${data.gameName} not found`);
            this.server.emit(WaitingRoomEvents.GameInfo, undefined);
        }
    }

    @SubscribeMessage(WaitingRoomEvents.AbortGameCreation)
    abortGameCreation(_socket: Socket, roomId: string): void {
        const gameRoom = this.gameModeService.getGameRoom(roomId);
        if (!gameRoom) return;
        this.logger.log(`Waiting room gateway: Game creation aborted: ${gameRoom.userGame.gameName}`);
        this.gameModeService.deleteGameRoom(roomId);
        this.server.emit(WaitingRoomEvents.GameDeleted, { gameName: gameRoom.userGame.gameName, gameMode: gameRoom.gameMode });
        this.server.emit(WaitingRoomEvents.GameCanceled, gameRoom);
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });

        this.chatGateway.deleteChannelById(roomId);
    }

    @SubscribeMessage(WaitingRoomEvents.RejectPlayer)
    playerRejected(_socket: Socket, playerInfo: { roomId: string; username: string }): void {
        const gameRoom = this.gameModeService.getGameRoom(playerInfo.roomId);
        if (gameRoom) {
            this.logger.log(`Waiting room gateway: ${playerInfo.username} rejected from game: ${gameRoom.userGame.gameName}`);
            gameRoom.userGame.potentialPlayers = gameRoom.userGame.potentialPlayers.filter((player) => player.username !== playerInfo.username);
            this.server.to(gameRoom.roomId).emit(WaitingRoomEvents.PlayerRejected, gameRoom);
            this.server.emit(GameFinderEvents.Games, {
                games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
                gameName: gameRoom.userGame.gameName,
                gameMode: gameRoom.gameMode,
            });
            this.chatGateway.unsubscribeFromChannel(_socket, { channelId: gameRoom.roomId, username: playerInfo.username });
        }
    }

    @SubscribeMessage(WaitingRoomEvents.AcceptPlayer)
    playerAccepted(_socket: Socket, playerInfo: { roomId: string; username: string; isAndroid: boolean }): void {
        const gameRoom = this.gameModeService.getGameRoom(playerInfo.roomId);
        if (gameRoom) {
            this.logger.log(`Waiting room gateway: ${playerInfo.username} accepted in game: ${gameRoom.userGame.gameName}`);
            gameRoom.userGame.potentialPlayers = gameRoom.userGame.potentialPlayers.filter((player) => player.username !== playerInfo.username);
            const newPlayer: CurrentPlayer = {
                username: playerInfo.username,
                isAndroid: playerInfo.isAndroid,
            };
            gameRoom.userGame.currentPlayers.push(newPlayer);
            gameRoom.userGame.differenceFoundByPlayers.push({ username: playerInfo.username, differencesFound: 0 });
            if (gameRoom.userGame.currentPlayers.length === this.MAX_PLAYERS_PER_GAME) {
                this.logger.log(`Waiting room gateway: game ${gameRoom.userGame.gameName} has reached the maximum number of players`);
                gameRoom.userGame.potentialPlayers.forEach((player) => {
                    this.server.to(gameRoom.roomId).emit(WaitingRoomEvents.PlayerRejected, gameRoom);
                    this.chatGateway.unsubscribeFromChannel(_socket, { channelId: gameRoom.roomId, username: player.username });
                });
                gameRoom.userGame.potentialPlayers = [];
            }
            this.server.to(gameRoom.roomId).emit(WaitingRoomEvents.PlayerAccepted, gameRoom);
            this.server.emit(GameFinderEvents.Games, {
                games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
                gameName: gameRoom.userGame.gameName,
                gameMode: gameRoom.gameMode,
            });
        }
    }

    @SubscribeMessage(WaitingRoomEvents.LeaveGame)
    async leaveGame(_socket: Socket, playerInfo: { roomId: string; username: string }): Promise<void> {
        const gameRoom = this.gameModeService.getGameRoom(playerInfo.roomId);
        if (!gameRoom) return;
        this.logger.log(`Waiting room gateway: ${playerInfo.username} left the game: ${gameRoom.userGame.gameName}`);
        gameRoom.userGame.potentialPlayers = gameRoom.userGame.potentialPlayers.filter((player) => player.username !== playerInfo.username);
        gameRoom.userGame.differenceFoundByPlayers = gameRoom.userGame.differenceFoundByPlayers.filter(
            (player) => player.username !== playerInfo.username,
        );
        gameRoom.userGame.currentPlayers = gameRoom.userGame.currentPlayers.filter((player) => player.username !== playerInfo.username);
        this.server.emit(WaitingRoomEvents.GameInfo, gameRoom);
        this.server.emit(GameFinderEvents.Games, {
            games: this.gameModeService.getGames(gameRoom.userGame.gameName, gameRoom.gameMode),
            gameName: gameRoom.userGame.gameName,
            gameMode: gameRoom.gameMode,
        });
        await this.chatGateway.unsubscribeFromChannel(_socket, { channelId: gameRoom.roomId, username: playerInfo.username });
    }

    async joinPrivateChatChannel(socket: Socket, gameRoom: GameRoom, username: string): Promise<void> {
        await this.chatGateway.unsubscribeFromAllPrivateChannels(socket, username);
        await this.chatGateway.subscribeToChannel(socket, { channelId: gameRoom.roomId, username });
    }

    handleDisconnect(socket: Socket): void {
        const username = this.userService.getUsernameBySocketId(socket.id);
        const gameRoom = this.gameModeService.findGameRoomByUsername(username);
        if (!gameRoom || gameRoom.started) return;
        this.logger.log(`Waiting room gateway: ${socket.id} | ${username} disconnected`);
        if (gameRoom.userGame.creator === username) {
            this.abortGameCreation(socket, gameRoom.roomId);
        } else {
            this.leaveGame(socket, { roomId: gameRoom.roomId, username });
        }
    }
}
