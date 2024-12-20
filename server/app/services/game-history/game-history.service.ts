/* eslint-disable no-console */
import { HistoryDocument } from '@app/model/database/game-history';
import { GameHistory } from '@app/model/dto/game-history/game-history.dto';
import { StatsUser } from '@common/classes/stats-user';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class GameHistoryService {
    constructor(@InjectModel('games-histories') public historyModel: Model<HistoryDocument>, private logger: Logger) {}
    async getStatsUser(userId: string, username: string): Promise<StatsUser> {
        const count = await this.historyModel.countDocuments({
            players: { $in: [userId] },
        });
        const numberGameWin = await this.historyModel.countDocuments({
            winner: userId,
        });
        const pipeline = [
            {
                $unwind: '$playerDiff',
            },
            {
                $match: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'playerDiff.username': username, // Filtre pour ne prendre que les éléments ayant un username défini
                },
            },

            {
                $group: {
                    _id: '$playerDiff.username',
                    averageDifferenceFound: { $avg: '$playerDiff.differencesFound' },
                },
            },
        ];
        const averageDiffFound = await this.historyModel.aggregate(pipeline);
        const timerAverage = await this.historyModel.aggregate([
            {
                $match: {
                    players: { $in: [userId] },
                },
            },
            {
                $group: {
                    _id: null,
                    averageTimer: { $avg: '$timer' },
                },
            },
        ]);
        const statsUser: StatsUser = {
            countGame: count,
            countGameWin: numberGameWin,
            averageDiff: averageDiffFound[0] ? parseFloat(averageDiffFound[0].averageDifferenceFound.toFixed(2)) : 0.0,
            averageTimer: timerAverage[0] ? timerAverage[0].averageTimer : 0,
        };
        return statsUser;
    }
    async getGamesHistories(): Promise<GameHistory[]> {
        return await this.historyModel.find({});
    }

    async getGamesHistory(userId: string): Promise<GameHistory[]> {
        return await this.historyModel.find({
            players: { $in: [userId] },
            deletedByUsers: { $nin: [userId] },
        });
    }

    async saveGameHistory(gameHistory: GameHistory): Promise<void> {
        try {
            await this.historyModel.create(gameHistory);
        } catch (error) {
            return this.logger.log(`Failed to save game history: ${error}`);
        }
    }

    async deleteGamesHistories(): Promise<void> {
        try {
            await this.historyModel.deleteMany({});
        } catch (error) {
            return Promise.reject(`Failed to delete game histories: ${error}`);
        }
    }

    async deleteGameHistory(userId: string): Promise<void> {
        try {
            await this.historyModel.updateMany({ players: { $in: [userId] } }, { $push: { deletedByUsers: userId } });

            const history = await this.historyModel.find({ players: { $in: [userId] } });
            for (const game of history) {
                if (game.deletedByUsers.length === game.players.length) {
                    await this.historyModel.deleteOne({ _id: game._id });
                }
            }
        } catch (error) {
            return Promise.reject(`Failed to delete game history: ${error}`);
        }
    }
}
