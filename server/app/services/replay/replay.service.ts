import { Game, GameDocument } from '@app/model/database/game';
import { NewReplay } from '@app/model/dto/replay/replay';
import { Replay } from '@common/classes/replay';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { Model } from 'mongoose';

@Injectable()
export class ReplayService {
    folderPath = './assets/replay/';

    constructor(@InjectModel(Game.name) public gameModel: Model<GameDocument>) {}

    async getAllReplays(): Promise<Replay[]> {
        try {
            const files = await fs.promises.readdir(this.folderPath);
            const replays: Replay[] = [];
            for (const filename of files) {
                const replay = this.readReplaysFromFile(filename);
                const game = await this.gameModel.findById(replay.gameId);
                if (game.name !== replay.gameName) {
                    replay.gameName = game.name;
                    this.updateReplay(replay);
                }
                if (replay) replays.push(replay);
            }
            return Promise.resolve(replays);
        } catch (error) {
            return Promise.reject(`Failed to getReplay: ${error}`);
        }
    }

    async getReplayById(replayId: string) {
        try {
            const replay = this.readReplaysFromFile(replayId);
            const game = await this.gameModel.findById(replay.gameId);
            if (game.name !== replay.gameName) {
                replay.gameName = game.name;
                this.updateReplay(replay);
            }
            if (replay) {
                return Promise.resolve(replay);
            } else {
                return Promise.reject('Failed to getReplayById: Replay not found');
            }
        } catch (error) {
            return Promise.reject(`Failed to getReplayById: ${error}`);
        }
    }

    async createReplay(newReplay: NewReplay): Promise<void> {
        try {
            const id = randomUUID();
            const gameId = (await this.gameModel.findOne({ name: newReplay.gameName }))._id.toString();
            const replay: Replay = {
                creator: newReplay.creator,
                gameName: newReplay.gameName,
                timeCreated: Date.now(),
                events: newReplay.events,
                snapshots: newReplay.snapshots,
                public: true,
                gameId,
                id,
            };
            this.saveReplayToFile(replay);
        } catch (error) {
            return Promise.reject(`Failed to createReplay: ${error}`);
        }
    }

    async updateReplay(replay: Replay): Promise<void> {
        try {
            this.deleteReplayFile(replay.id);
            this.saveReplayToFile(replay);
        } catch (error) {
            return Promise.reject(`Failed to updateReplay: ${error}`);
        }
    }

    async deleteReplay(replayId: string): Promise<void> {
        try {
            this.deleteReplayFile(replayId);
        } catch (error) {
            return Promise.reject(`Failed to deleteReplay: ${error}`);
        }
    }

    async deleteReplaysByUserId(userId: string): Promise<void> {
        try {
            const files = await fs.promises.readdir(this.folderPath);
            for (const filename of files) {
                const replay = this.readReplaysFromFile(filename);
                if (replay.creator === userId) {
                    this.deleteReplayFile(replay.id);
                }
            }
        } catch (error) {
            return Promise.reject(`Failed to deleteReplaysByUserId: ${error}`);
        }
    }

    async deleteAllReplays(): Promise<void> {
        try {
            this.deleteAllReplayFiles();
        } catch (error) {
            return Promise.reject(`Failed to deleteAllReplays: ${error}`);
        }
    }

    getComments(replayId: string): Comment[] {
        const comments = this.readReplayCommentsFromFile(replayId);
        if (comments) {
            return comments;
        }
        return [];
    }

    getLikes(replayId: string): string[] {
        const likes = this.readReplayLikesFromFile(replayId);
        if (likes) {
            return likes;
        }
        return [];
    }

    like(replayId: string, userId: string) {
        let likes = this.readReplayLikesFromFile(replayId);
        if (!likes) {
            likes = [];
        }
        likes.push(userId);
        this.saveReplayLikesToFile(replayId, likes);
        return likes;
    }

    unlike(replayId: string, userId: string) {
        let likes = this.readReplayLikesFromFile(replayId);
        if (likes) {
            likes = likes.filter((id) => id !== userId);
            this.saveReplayLikesToFile(replayId, likes);
            return likes;
        }
        return [];
    }

    comment(commentMessage: string, replayId: string, userId: string) {
        let replayComments = this.readReplayCommentsFromFile(replayId);
        if (!replayComments) {
            replayComments = [];
        }
        const comment = {
            comment: commentMessage,
            time: Date.now(),
            userId,
        };
        replayComments.push(comment);
        this.saveReplayCommentsToFile(replayId, replayComments);
        return replayComments;
    }

    private saveReplayCommentsToFile(replayId: string, replayComments: { comments: { comment: string; userId: string }[] }) {
        const jsonValue = JSON.stringify(replayComments);
        const dirName = `./assets/replay/${replayId}/`;

        if (!fs.existsSync('./assets/replay')) fs.mkdirSync('./assets/replay');
        if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
        fs.writeFile(`${dirName}comments.json`, jsonValue, () => {
            return; // folder already exists
        });
    }

    private saveReplayLikesToFile(replayId: string, replayLikes: { likes: string[] }) {
        const jsonValue = JSON.stringify(replayLikes);
        const dirName = `./assets/replay/${replayId}/`;

        if (!fs.existsSync('./assets/replay')) fs.mkdirSync('./assets/replay');
        if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
        fs.writeFile(`${dirName}likes.json`, jsonValue, () => {
            return; // folder already exists
        });
    }

    private readReplayLikesFromFile(replayId: string) {
        try {
            const dirName = `./assets/replay/${replayId}/`;
            if (!fs.existsSync(dirName)) return;

            if (!fs.existsSync(`${dirName}likes.json`)) return;
            const data = fs.readFileSync(`${dirName}likes.json`, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }

    private readReplayCommentsFromFile(replayId: string) {
        const dirName = `./assets/replay/${replayId}/`;
        if (!fs.existsSync(dirName)) return;

        if (!fs.existsSync(`${dirName}comments.json`)) return;
        const data = fs.readFileSync(`${dirName}comments.json`, 'utf8');
        return JSON.parse(data);
    }

    private readReplaysFromFile(fileName: string) {
        const dirName = `./assets/replay/${fileName}/`;
        if (!fs.existsSync(dirName)) return;

        if (!fs.existsSync(`${dirName}${fileName}.json`)) return;
        const data = fs.readFileSync(`${dirName}${fileName}.json`, 'utf8');
        return JSON.parse(data);
    }

    private saveReplayToFile(replay: Replay) {
        const jsonValue = JSON.stringify(replay);
        const dirName = `./assets/replay/${replay.id}/`;

        if (!fs.existsSync('./assets/replay')) fs.mkdirSync('./assets/replay');
        if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
        fs.writeFile(`${dirName}${replay.id}.json`, jsonValue, () => {
            return; // folder already exists
        });
    }

    private deleteReplayFile(replayId: string) {
        const dirName = `./assets/replay/${replayId}`;
        if (!fs.existsSync(dirName)) return;

        fs.rmSync(dirName, { recursive: true, force: true });
    }

    private deleteAllReplayFiles() {
        const dirName = './assets/replay/';
        if (!fs.existsSync(dirName)) return;

        const files = fs.readdirSync(dirName);
        for (const file of files) {
            fs.rmSync(`${dirName}${file}`, { recursive: true, force: true });
        }
    }
}
