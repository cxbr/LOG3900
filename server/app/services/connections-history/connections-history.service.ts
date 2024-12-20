import { ConnectionsDocument } from '@app/model/database/connections-history';
import { ConnectionsHistory } from '@app/model/dto/connections-history/connections-history.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ConnectionsHistoryService {
    constructor(@InjectModel('connections-histories') public connectionsModel: Model<ConnectionsDocument>) {}

    async getConnectionsHistories(): Promise<ConnectionsHistory[]> {
        return await this.connectionsModel.find({});
    }

    async getConnectionHistory(userId: string): Promise<ConnectionsHistory[]> {
        return await this.connectionsModel.find({ userId });
    }

    async saveConnectionHistory(connectionHistory: ConnectionsHistory): Promise<void> {
        try {
            await this.connectionsModel.create(connectionHistory);
        } catch (error) {
            return Promise.reject(`Failed to save connection history: ${error}`);
        }
    }

    async deleteConnectionsHistories(): Promise<void> {
        try {
            await this.connectionsModel.deleteMany({});
        } catch (error) {
            return Promise.reject(`Failed to delete connection histories: ${error}`);
        }
    }
}
