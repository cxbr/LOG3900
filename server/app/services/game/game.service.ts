/* eslint-disable no-console */
import { NOT_TOP3 } from '@app/constants/constants';
import { environment } from '@app/environments/environment';
import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { GameModeGateway } from '@app/gateways/game-mode/game-mode.gateway';
import { Game, GameDocument } from '@app/model/database/game';
import { NewBestTime } from '@app/model/dto/game/new-best-time.dto';
import { NewGame } from '@app/model/dto/game/new-game.dto';
import { NewName } from '@app/model/dto/game/new-name.dto';
import { GameImageService } from '@app/services/image/game-image.service';
import { BestTime } from '@common/classes/best-time';
import { GameData } from '@common/classes/game-data';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { Model } from 'mongoose';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(Game.name) public gameModel: Model<GameDocument>,
        private readonly gameModeGateway: GameModeGateway,
        private readonly chatGateway: ChatGateway,
        private readonly gameImageService: GameImageService,
    ) {}

    async getAllGames(): Promise<GameData[]> {
        const games = await this.gameModel.find({ isDeleted: false }).lean();
        const gameDataPromises = games.map(async (game) => this.convertGameToGameData(game, false));
        const gameData = await Promise.all(gameDataPromises);
        return gameData;
    }

    async getGame(name: string): Promise<GameData> {
        const game = await this.gameModel.findOne({ name });
        if (!game) return Promise.reject('Failed to get game');
        return this.convertGameToGameData(game, true);
    }

    async getGameById(id: string): Promise<GameData> {
        const game = await this.gameModel.findById(id);
        if (!game) return Promise.reject('Failed to get game');
        return this.convertGameToGameData(game, true);
    }

    async getBestTime(name: string): Promise<{ soloBestTimes: BestTime[]; vsBestTimes: BestTime[] }> {
        const game = await this.gameModel.findOne({ name });
        if (!game) return undefined;
        return { soloBestTimes: game.soloBestTimes, vsBestTimes: game.vsBestTimes };
    }

    async createNewGame(newGame: NewGame): Promise<void> {
        try {
            await this.gameImageService.saveImages(newGame);
            await this.gameImageService.saveMatrix(newGame);
            await this.gameImageService.saveDifferencesHashMap(newGame);
            const gameToSave = await this.convertNewGameToGame(newGame);
            await this.gameModel.create(gameToSave);
        } catch (error) {
            return Promise.reject(`Failed to insert game: ${error}`);
        }
    }

    async renameGame(newName: NewName): Promise<void> {
        try {
            this.renameFolder(newName.oldName, newName.newName);
            const game = await this.gameModel.findOne({ name: newName.oldName });
            game.name = newName.newName;
            await this.gameModel.findOneAndUpdate({ name: newName.oldName }, { $set: { name: newName.newName } });
            this.gameModeGateway.cancelDeletedGame(newName.oldName);
        } catch (error) {
            return Promise.reject(`Failed to rename game: ${error}`);
        }
    }

    async deleteGame(name: string): Promise<void> {
        try {
            const newGame = await this.gameModel.findOne({ name });
            if (!newGame) return Promise.reject('Could not find game');
            const res = await this.gameModel.findOneAndUpdate({ name }, { isDeleted: true, name: newGame.id }, { new: true });
            if (!res) return Promise.reject('Could not delete game');
            this.renameFolder(name, newGame.name);
            this.gameModeGateway.cancelDeletedGame(name);
            await this.deleteReviewFile(name);
        } catch (error) {
            return Promise.reject(`Failed to delete game: ${error}`);
        }
    }

    async deleteReviewFile(gameName: string) {
        const dirName = './assets/rating/';
        const filePath = `${dirName}/review-${gameName}.json`;

        try {
            fs.unlink(filePath, () => {
                return;
            });
        } catch (error) {
            Promise.reject(`We have issue in the process ${error}`);
        }
    }

    async deleteAllGames(): Promise<void> {
        try {
            const games = await this.gameModel.find({});
            games.forEach(async (game) => {
                await this.deleteGame(game.name);
                await this.deleteReviewFile(game.name);
            });
        } catch (error) {
            return Promise.reject(`Failed to delete all games: ${error}`);
        }
    }

    async deleteBestTimes(): Promise<void> {
        try {
            const games = await this.gameModel.find({});
            games.forEach(async (game) => {
                game.soloBestTimes = this.newBestTimes();
                game.vsBestTimes = this.newBestTimes();
                await game.save();
            });
        } catch (error) {
            return Promise.reject(`Failed to delete all best times: ${error}`);
        }
    }

    async deleteBestTime(name: string): Promise<void> {
        try {
            const game = await this.gameModel.findOne({ name });
            game.soloBestTimes = this.newBestTimes();
            game.vsBestTimes = this.newBestTimes();
            await game.save();
        } catch (error) {
            return Promise.reject(`Failed to delete best time: ${error}`);
        }
    }

    async updateBestTime(name: string, newBestTime: NewBestTime): Promise<number> {
        try {
            const game = await this.gameModel.findOne({ name });
            if (!game) return Promise.reject('Could not find game');
            let position;
            if (newBestTime.isSolo) {
                const { newBestTimes, position: newPosition } = this.insertNewBestTime(game.soloBestTimes, newBestTime);
                game.soloBestTimes = newBestTimes;
                position = newPosition;
            } else {
                const { newBestTimes, position: newPosition } = this.insertNewBestTime(game.vsBestTimes, newBestTime);
                game.vsBestTimes = newBestTimes;
                position = newPosition;
            }
            await game.save();
            if (position !== NOT_TOP3) this.chatGateway.newBestTimeScore(this.getNewBestTimeMessage(newBestTime, position));
            return position;
        } catch (error) {
            return Promise.reject(`Failed to update best time: ${error}`);
        }
    }

    private async convertNewGameToGame(newGame: NewGame): Promise<Game> {
        const game = {
            name: newGame.name,
            creator: newGame.creator,
            isDeleted: false,
            wantShoutout: newGame.wantShoutout,
            nbDifference: newGame.nbDifference,
            soloBestTimes: this.newBestTimes(),
            vsBestTimes: this.newBestTimes(),
            difficulty: newGame.difficulty,
        };
        return game;
    }

    private insertNewBestTime(bestTimes: BestTime[], newBestTime: NewBestTime): { newBestTimes: BestTime[]; position: number } {
        const newBestTimes = bestTimes;
        const newBestTimeToInsert = new BestTime();
        newBestTimeToInsert.name = newBestTime.name;
        newBestTimeToInsert.time = newBestTime.time;
        newBestTimes.push(newBestTimeToInsert);
        newBestTimes.sort((a, b) => a.time - b.time);
        newBestTimes.pop();
        return { newBestTimes, position: newBestTimes.findIndex((bestTime) => bestTime.name === newBestTime.name) };
    }

    private newBestTimes(): BestTime[] {
        return [
            { name: 'Joueur 1', time: 60 },
            { name: 'Joueur 2', time: 120 },
            { name: 'Joueur 3', time: 180 },
        ];
    }

    private getNewBestTimeMessage(newBestTime: NewBestTime, position: number) {
        let positionStr = '';
        if (position === 0) positionStr = `${position + 1}ere`;
        else positionStr = `${position + 1}eme`;

        if (newBestTime.isSolo) {
            return `${newBestTime.name} obtient la ${positionStr} place dans les meilleurs temps du jeu ${newBestTime.gameName} en mode solo`;
        }
        return `${newBestTime.name} obtient la ${positionStr} place dans les meilleurs temps du jeu ${newBestTime.gameName} en mode un contre un`;
    }

    private async convertGameToGameData(game: Game, getMatrix: boolean): Promise<GameData> {
        const gameData = {
            name: game.name,
            creator: game.creator,
            wantShoutout: game.wantShoutout,
            nbDifference: game.nbDifference,
            image1url: `${environment.serverUrl}/games/${game.name}/image1.bmp`,
            image2url: `${environment.serverUrl}/games/${game.name}/image2.bmp`,
            difficulty: game.difficulty,
            soloBestTimes: game.soloBestTimes,
            vsBestTimes: game.vsBestTimes,
            differenceMatrix: getMatrix ? await this.gameImageService.getMatrix(game.name) : undefined,
            differenceHashMap: getMatrix ? await this.gameImageService.getDifferencesHashMap(game.name) : undefined,
        };
        return gameData;
    }

    private renameFolder(oldName: string, newName: string): void {
        try {
            const oldPath = `./assets/games/${oldName}/`;
            const newPath = `./assets/games/${newName}/`;
            fs.renameSync(oldPath, newPath);
            const oldRatingPath = `./assets/rating/review-${oldName}.json`;
            const newRatingPath = `./assets/rating/review-${newName}.json`;
            if (fs.existsSync(oldRatingPath)) {
                fs.renameSync(oldRatingPath, newRatingPath);
            }
        } catch (err) {
            throw new Error('Could not rename');
        }
    }
}
