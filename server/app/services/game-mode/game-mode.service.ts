/* eslint-disable max-lines */
import { gameHistoryMode } from '@app/constants/game-history-mode';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameHistory } from '@app/model/database/game-history';
import { EndGame } from '@app/model/schema/end-game.schema';
import { Vector2D } from '@app/model/schema/vector2d.schema';
import { GameHistoryService } from '@app/services/game-history/game-history.service';
import { GameService } from '@app/services/game/game.service';
import { UserService } from '@app/services/user/user.service';
import { GameData } from '@common/classes/game-data';
import { GameRoom } from '@common/classes/game-room';
import { CurrentPlayer } from '@common/classes/user-game';
import { Color } from '@common/enums/color';
import { GameMode } from '@common/game-mode';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Socket } from 'socket.io';
@Injectable()
export class GameModeService {
    private readonly excludedColors: Set<string> = new Set(Object.values(Color));
    private gameRooms: Map<string, GameRoom> = new Map<string, GameRoom>();
    private gameHistory: Map<string, GameHistory> = new Map<string, GameHistory>();
    private gamesData: Map<string, GameData> = new Map<string, GameData>();
    private gamesColors: Map<string, string[]> = new Map<string, string[]>();

    constructor(
        private gameHistoryService: GameHistoryService,
        private userService: UserService,
        @Inject(forwardRef(() => GameService)) private gameService: GameService,
        private chatGateway: ChatGateway,
        private logger: Logger,
    ) {}
    getGameRoom(roomId?: string, gameName?: string, gameMode?: string): GameRoom {
        if (roomId) return this.gameRooms.get(roomId);
        if (gameMode === GameMode.classicMode) {
            for (const gameRoom of this.gameRooms.values()) {
                if (gameRoom.userGame.gameName === gameName && gameRoom.gameMode === gameMode) return gameRoom;
            }
        } else {
            for (const gameRoom of this.gameRooms.values()) {
                if (gameRoom.gameMode === gameMode) return gameRoom;
            }
        }
        return undefined;
    }

    setGameData(gameData: GameData, roomId: string): void {
        this.gamesData.set(roomId, gameData);
    }

    updateGameMatrix(differenceMatrix: number[][], roomId: string): void {
        const gameData = this.gamesData.get(roomId);
        if (!gameData) return;
        gameData.differenceMatrix = differenceMatrix;
        this.gamesData.set(roomId, gameData);
    }

    getGames(gameName: string, gameMode: string): GameRoom[] {
        const games: GameRoom[] = [];
        for (const gameRoom of this.gameRooms.values()) {
            if (gameRoom.gameMode === GameMode.limitedTimeMode && gameRoom.gameMode === gameMode) {
                games.push(gameRoom);
            } else if (
                gameRoom.gameMode === GameMode.classicMode &&
                gameRoom.gameMode === gameMode &&
                gameRoom.userGame.gameName === gameName &&
                ((gameRoom.started && gameRoom.userGame.currentPlayers.length > 1) || !gameRoom.started)
            ) {
                games.push(gameRoom);
            }
        }
        return games;
    }

    removeObserver(gameRoom: GameRoom, username: string): void {
        gameRoom.userGame.observers = gameRoom.userGame.observers.filter((observer) => observer.username !== username);
    }

    setGameRoom(gameRoom: GameRoom): void {
        this.gameRooms.set(gameRoom.roomId, gameRoom);
    }

    getGameHistory(roomId: string): GameHistory {
        return this.gameHistory.get(roomId);
    }

    setGameHistory(roomId: string, gameHistory: GameHistory): void {
        this.gameHistory.set(roomId, gameHistory);
    }

    deleteGameHistory(roomId: string): void {
        this.gameHistory.delete(roomId);
    }

    deleteGameRoom(roomId: string): void {
        this.gameRooms.delete(roomId);
        this.gamesData.delete(roomId);
    }

    // This function is used to refresh the game room when in limited time mode after a difference is found
    async refreshRoomGame(gameRoom: GameRoom): Promise<void> {
        if (gameRoom.gameMode === GameMode.classicMode) return;
        this.setGameRoom(gameRoom);
        try {
            const game = await this.gameService.getGame(gameRoom.userGame.gameName);
            if (game) {
                game.differenceMatrix = game.differenceHashMap[gameRoom.userGame.chosenDifference].differenceMatrix;
                this.gamesData.set(gameRoom.roomId, game);
                this.logger.debug(
                    `Setting game data ${game.name} for game ${gameRoom.userGame.gameName} \
                    with difference matrix ${gameRoom.userGame.chosenDifference}`,
                );
            }
        } catch (error) {
            throw new Error(`Failed to get game ${gameRoom.userGame.gameName}: ${error}`);
        }
    }

    joinGame(socket: Socket, data: { gameName: string; user: CurrentPlayer; gameMode: string; roomId: string }): boolean {
        const gameRoom = this.getGameRoom(data.roomId);
        if (!gameRoom) return false;
        gameRoom.userGame.potentialPlayers.push(data.user);
        socket.join(gameRoom.roomId);
        return true;
    }

    observeGame(socket: Socket, data: { gameName: string; user: CurrentPlayer; gameMode: string; roomId: string }): boolean {
        const gameRoom = this.getGameRoom(data.roomId);
        if (!gameRoom) return false;
        if (!gameRoom.userGame.observers) {
            gameRoom.userGame.observers = [];
        }
        if (!this.gamesColors.has(data.roomId)) {
            this.gamesColors.set(data.roomId, []);
        }
        const observer = {
            username: data.user.username,
            color: this.generateColor(data.roomId),
            isAndroid: data.user.isAndroid,
        };
        gameRoom.userGame.observers.push(observer);
        socket.join(gameRoom.roomId);
        return true;
    }

    saveGameHistory(gameRoom: GameRoom): void {
        const newGameHistory = new GameHistory();
        newGameHistory._id = randomUUID();
        newGameHistory.players = [];
        newGameHistory.playerDiff = [];

        newGameHistory.name = gameRoom.userGame.gameName;
        for (const player of gameRoom.userGame.currentPlayers) {
            try {
                const username = player.username;
                this.userService.getUserByUsername(username).then((user) => {
                    if (user) {
                        newGameHistory.players.push(user._id);
                    }
                });
            } catch (error) {
                throw new Error(`Failed to get user by username: ${error}`);
            }
        }

        newGameHistory.startTime = Date.now();
        newGameHistory.timer = 0;

        if (gameRoom.gameMode === GameMode.classicMode) {
            if (gameRoom.userGame.currentPlayers.length > 1) newGameHistory.gameMode = gameHistoryMode.classicModeMultiplayer;
            else newGameHistory.gameMode = gameHistoryMode.classicModeSolo;
        } else {
            if (gameRoom.userGame.currentPlayers.length > 1) newGameHistory.gameMode = gameHistoryMode.limitedTimeModeMultiplayer;
            else newGameHistory.gameMode = gameHistoryMode.limitedTimeModeSolo;
        }
        newGameHistory.playerDiff = gameRoom.userGame.differenceFoundByPlayers;
        this.setGameHistory(gameRoom.roomId, newGameHistory);
    }

    validateDifference(gameId: string, differencePos: Vector2D, username: string, validated: boolean): boolean {
        const gameRoom = this.getGameRoom(gameId);
        // const gameData = this.gamesData.get(gameId);
        if (!gameRoom) {
            return false;
        }
        // const validated = gameData.differenceMatrix[differencePos.y][differencePos.x] !== EMPTYPIXEL_VALUE;
        if (validated) {
            gameRoom.userGame.nbDifferenceFound++;
            gameRoom.userGame.differenceFoundByPlayers = gameRoom.userGame.differenceFoundByPlayers.map((obj) =>
                obj.username === username ? { ...obj, differencesFound: obj.differencesFound + 1 } : obj,
            );
        }
        return validated;
    }

    isGameFinished(gameRoom: GameRoom): boolean {
        const gameData = this.gamesData.get(gameRoom.roomId);
        if (gameRoom.gameMode === GameMode.classicMode) {
            if (gameRoom.userGame.nbDifferenceFound === gameData.nbDifference) return true;
            if (gameRoom.userGame.timer > 0) {
                const maxScore = Math.max(...gameRoom.userGame.differenceFoundByPlayers.map((player) => player.differencesFound));
                const remainingDifferences = gameData.nbDifference - gameRoom.userGame.nbDifferenceFound;

                let numberOfPlayersThatHaveMaxScore = 0;

                // For each player, we'll check if the remaining differences are enough to catch up with the player
                for (const player of gameRoom.userGame.differenceFoundByPlayers) {
                    if (player.differencesFound === maxScore) {
                        numberOfPlayersThatHaveMaxScore++;
                        continue;
                    }

                    if (player.differencesFound + remainingDifferences > maxScore) {
                        return false;
                    }
                }

                // If there is more than one player with the max score, we need to check if the remaining differences for one of them to win
                if (numberOfPlayersThatHaveMaxScore > 1) {
                    return false;
                }
            }
            return true;
        } else {
            return gameRoom.userGame.timer <= 0;
        }
    }

    abandonGameHistory(gameRoom: GameRoom, username: string): void {
        let userId = '';
        try {
            this.userService.getUserByUsername(username).then((user) => {
                if (user) {
                    userId = user._id;
                    const gameHistory = this.getGameHistory(gameRoom.roomId);
                    if (gameRoom.userGame.currentPlayers.length === 0) {
                        const endGame: EndGame = {
                            winner: '',
                            roomId: gameRoom.roomId,
                            players: gameHistory.players,
                            gameFinished: false,
                            abandoned: this.getGameHistory(gameRoom.roomId).abandoned,
                            gameMode: gameHistory.gameMode,
                            gameName: gameHistory.name,
                            gameDuration: gameHistory.timer,
                            tiedPlayers: [],
                            playerDiff: [],
                        };
                        this.updateGameHistory(endGame);
                    }
                    if (gameHistory.players.length > 1) {
                        if (!gameHistory.abandoned) gameHistory.abandoned = [];
                        gameHistory.abandoned.push(userId);
                    }
                    this.setGameHistory(gameRoom.roomId, gameHistory);
                }
            });
        } catch (error) {
            throw new Error(`Failed to get user by username: ${error}`);
        }
    }

    initNewRoom(socket: Socket, gameRoom: GameRoom): void {
        gameRoom.userGame.potentialPlayers = [];
        try {
            this.gameService.getGame(gameRoom.userGame.gameName).then((game) => {
                if (game) {
                    this.gamesData.set(gameRoom.roomId, game);
                }
            });
        } catch (error) {
            throw new Error(`Failed to get game ${gameRoom.userGame.gameName}: ${error}`);
        }

        this.setGameRoom(gameRoom);
        socket.join(gameRoom.roomId);
    }

    canJoinGame(data: { gameName: string; username: string; gameMode: string }): GameRoom {
        const gameRoom = this.getGameRoom(undefined, data.gameName, data.gameMode);
        if (!gameRoom) return undefined;
        if (!gameRoom.userGame.potentialPlayers) {
            gameRoom.userGame.potentialPlayers = [];
        }
        return gameRoom;
    }

    getRoomsValues(): GameRoom[] {
        return Array.from(this.gameRooms.values());
    }

    applyTimeToTimer(roomId: string, time: number): void {
        const gameRoom = this.getGameRoom(roomId);
        if (!gameRoom) return;
        gameRoom.userGame.timer += time;
    }

    updateTimer(gameRoom: GameRoom): void {
        gameRoom.userGame.timer--;
        if (gameRoom.userGame.timer > gameRoom.gameConstants.gameDuration) {
            gameRoom.userGame.timer = gameRoom.gameConstants.gameDuration;
        } else if (gameRoom.userGame.timer < 0) {
            gameRoom.userGame.timer = 0;
        }
    }

    endGame(gameRoom: GameRoom): EndGame {
        const players = [];
        const abandoned = [];
        if (gameRoom.userGame.abandonedPlayers) {
            for (const player of gameRoom.userGame.abandonedPlayers) {
                if (player) {
                    abandoned.push(this.userService.getUserByUsername(player.username).then((user) => user._id));
                }
            }
        }
        for (const player of gameRoom.userGame.currentPlayers) {
            if (player) {
                players.push(this.userService.getUserByUsername(player.username).then((user) => user._id));
            }
        }

        const endGame: EndGame = {
            gameFinished: true,
            roomId: gameRoom.roomId,
            players,
            gameMode: gameRoom.gameMode,
            gameName: gameRoom.userGame.gameName,
            gameDuration: gameRoom.gameConstants.gameDuration - gameRoom.userGame.timer,
            winner: '',
            abandoned,
            tiedPlayers: [],
            playerDiff: [],
        };

        if (gameRoom.gameMode === GameMode.classicMode) {
            const maxScore = Math.max(...gameRoom.userGame.differenceFoundByPlayers.map((player) => player.differencesFound));
            const winners = gameRoom.userGame.differenceFoundByPlayers.filter((player) => player.differencesFound === maxScore);
            endGame.playerDiff = gameRoom.userGame.differenceFoundByPlayers;
            if (winners.length === 1) {
                endGame.winner = winners[0].username;
            } else {
                endGame.tiedPlayers = winners.map((winner) => winner.username);
            }
        }
        this.updateGameHistory(endGame);
        this.deleteGameRoom(gameRoom.roomId);
        this.chatGateway.deleteChannelById(gameRoom.roomId);
        return endGame;
    }

    abandonGame(socket: Socket, gameRoom: GameRoom, username: string): void {
        this.abandonGameHistory(gameRoom, username);
        if (!gameRoom.userGame.abandonedPlayers) {
            gameRoom.userGame.abandonedPlayers = [];
        }
        const abandonedPlayer = gameRoom.userGame.currentPlayers.find((player) => player.username === username);
        if (abandonedPlayer) {
            gameRoom.userGame.abandonedPlayers.push(abandonedPlayer);
        }
        gameRoom.userGame.currentPlayers = gameRoom.userGame.currentPlayers.filter((player) => player.username !== username);
        gameRoom.userGame.differenceFoundByPlayers = gameRoom.userGame.differenceFoundByPlayers.filter((obj) => obj.username !== username);
        if (gameRoom.gameMode === GameMode.limitedTimeMode && username === gameRoom.userGame.creator && gameRoom.userGame.currentPlayers.length > 0) {
            gameRoom.userGame.creator = gameRoom.userGame.currentPlayers[0].username;
        }
        this.chatGateway.unsubscribeFromChannel(socket, { channelId: gameRoom.roomId, username });
    }

    findGameRoomByUsername(username: string): GameRoom | undefined {
        for (const gameRoom of this.gameRooms.values()) {
            const hasPlayer = gameRoom.userGame.currentPlayers.some((player) => player.username === username);
            if (hasPlayer) {
                return gameRoom;
            }
        }
        return undefined;
    }

    private generateColor(roomId: string): string {
        const letters = '0123456789ABCDEF';
        let color = '#';
        const colorLength = 6;
        const gameCurrentColors = this.gamesColors.get(roomId);
        do {
            for (let i = 0; i < colorLength; i++) {
                color += letters[Math.floor(Math.random() * letters.length)];
            }
        } while (this.excludedColors.has(color) && gameCurrentColors.includes(color));
        gameCurrentColors.push(color);
        return color;
    }

    private updateGameHistory(endGame: EndGame): void {
        try {
            const gameHistory = this.getGameHistory(endGame.roomId);
            gameHistory.timer = Date.now() - gameHistory.startTime;
            if (endGame.gameFinished) {
                gameHistory.playerDiff = endGame.playerDiff;
                if (endGame.winner) {
                    try {
                        this.userService.getUserByUsername(endGame.winner).then((user) => {
                            if (user) {
                                gameHistory.winner = user._id;
                                this.setGameHistory(endGame.roomId, gameHistory);
                                this.gameHistoryService.saveGameHistory(gameHistory);
                            }
                        });
                    } catch (error) {
                        throw new Error(`Failed to get user by username: ${error}`);
                    }
                } else {
                    // No winner in limited time mode
                    this.setGameHistory(endGame.roomId, gameHistory);
                    this.gameHistoryService.saveGameHistory(gameHistory);
                }
            } else {
                if (!gameHistory.abandoned) gameHistory.abandoned = [];
                gameHistory.playerDiff = endGame.playerDiff;
                gameHistory.abandoned = endGame.abandoned;
                this.setGameHistory(endGame.roomId, gameHistory);
                this.gameHistoryService.saveGameHistory(gameHistory);
            }
        } catch (error) {
            this.logger.error(`Failed to update game history: ${error}`);
        }
    }
}
