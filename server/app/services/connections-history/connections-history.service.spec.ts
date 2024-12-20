import { connectionsType } from '@app/constants/connections-type';
import { DELAY_BEFORE_CLOSING_CONNECTION } from '@app/constants/constants';
import { ConnectionsDocument, ConnectionsHistory, connectionsHistorySchema } from '@app/model/database/connections-history';
import { ConnectionsHistoryService } from '@app/services/connections-history/connections-history.service';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';

describe('ConnectionsHistoryService', () => {
    let service: ConnectionsHistoryService;
    let connectionsHistoryModel: Model<ConnectionsDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;
    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                    imports: undefined,
                }),
                MongooseModule.forFeature([{ name: 'connections-histories', schema: connectionsHistorySchema }]),
            ],
            providers: [ConnectionsHistoryService],
        }).compile();

        service = module.get<ConnectionsHistoryService>(ConnectionsHistoryService);
        connectionsHistoryModel = module.get<Model<ConnectionsDocument>>(getModelToken('connections-histories'));
        connection = await module.get(getConnectionToken());
    });
    afterEach((done) => {
        // The database get auto populated in the constructor
        // We want to make sur we close the connection after the database got
        // populated. So we add small delay
        setTimeout(async () => {
            await connection.close();
            await mongoServer.stop();
            done();
        }, DELAY_BEFORE_CLOSING_CONNECTION);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(connectionsHistoryModel).toBeDefined();
    });

    it('getConnectionsHistories should return the connections', async () => {
        await connectionsHistoryModel.deleteMany({});
        await connectionsHistoryModel.create(getFakeConnectionsHistory());
        await connectionsHistoryModel.create(getFakeConnectionsHistory2());
        const connectionsHistories = await service.getConnectionsHistories();
        expect(connectionsHistories.length).toEqual(2);
        expect(connectionsHistories[0].username).toEqual(getFakeConnectionsHistory().username);
        expect(connectionsHistories[1].username).toEqual(getFakeConnectionsHistory2().username);
    });

    it('saveConnectionHistory should save the connection history in database', async () => {
        await connectionsHistoryModel.deleteMany({});
        await service.saveConnectionHistory(getFakeConnectionsHistory());
        const connectionsHistories = await service.getConnectionsHistories();
        expect(connectionsHistories.length).toEqual(1);
        expect(connectionsHistories[0].username).toEqual(getFakeConnectionsHistory().username);
    });

    it('saveConnectionHistory should have rejected if cannot create new connectionHistory', async () => {
        jest.spyOn(connectionsHistoryModel, 'create').mockImplementation(async () => Promise.reject(''));
        await connectionsHistoryModel.deleteMany({});
        await expect(service.saveConnectionHistory(getFakeConnectionsHistory())).rejects.toBeTruthy();
    });

    it('deleteConnectionsHistories should delete all connection histories in database', async () => {
        await connectionsHistoryModel.deleteMany({});
        await connectionsHistoryModel.create(getFakeConnectionsHistory());
        await connectionsHistoryModel.create(getFakeConnectionsHistory2());
        await service.deleteConnectionsHistories();
        const connectionsHistories = await service.getConnectionsHistories();
        expect(connectionsHistories.length).toEqual(0);
    });

    it('deleteConnectionsHistories should have rejected if cannot delete', async () => {
        jest.spyOn(connectionsHistoryModel, 'deleteMany').mockRejectedValue('');
        try {
            await service.deleteConnectionsHistories();
        } catch (e) {
            expect(e).toBeTruthy();
        }
    });
});

const getFakeConnectionsHistory = (): ConnectionsHistory => ({
    userId: 'FakeUserId',
    username: 'FakeUser1',
    connectionType: connectionsType.accountCreation,
    connectionTime: 0,
});

const getFakeConnectionsHistory2 = (): ConnectionsHistory => ({
    userId: 'FakeUserId2',
    username: 'FakeUser2',
    connectionType: connectionsType.connection,
    connectionTime: 0,
});
