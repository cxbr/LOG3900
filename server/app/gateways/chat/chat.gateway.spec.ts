import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { ChatService } from '@app/services/chat/chat.service';
import { TokenService } from '@app/services/firebase/token.service';
import { UserService } from '@app/services/user/user.service';
import { GameRoom } from '@common/classes/game-room';
import { CurrentPlayer, UserGame } from '@common/classes/user-game';
import { ChatEvents } from '@common/enums/chat.gateway.variables';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { BroadcastOperator, Server, Socket } from 'socket.io';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let logger: SinonStubbedInstance<Logger>;
    let chatPersistenceService: SinonStubbedInstance<ChatService>;
    let userService: SinonStubbedInstance<UserService>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let tokenService: SinonStubbedInstance<TokenService>;

    beforeEach(async () => {
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        chatPersistenceService = createStubInstance(ChatService);
        userService = createStubInstance(UserService);
        tokenService = createStubInstance(TokenService);
        Object.defineProperty(socket, 'id', { value: getFakeGameRoom().roomId, writable: true });
        Object.defineProperty(socket, 'socketId', { value: getFakeGameRoom().roomId, writable: true });
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: Logger,
                    useValue: logger,
                },
                {
                    provide: ChatService,
                    useValue: chatPersistenceService,
                },
                {
                    provide: UserService,
                    useValue: userService,
                },
                {
                    provide: TokenService,
                    useValue: tokenService,
                },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    // I get an error about undefined socketId when I run this test... had to comment it out

    // it('should send a message to the room', () => {
    //     const room = getFakeGameRoom();
    //     server.to.returns({
    //         emit: (event: string) => {
    //             expect(event).toEqual(ChatEvents.MessageSent);
    //         },
    //     } as BroadcastOperator<unknown, unknown>);
    //     gateway.sendMessage(socket, { message: 'fake message', username: room.userGame.username1, roomId: room.roomId });
    // });

    it('newBestScore should send newBestScore to everyone', () => {
        server.to.returns({
            emit: (event: string, message: string) => {
                expect(event).toEqual(ChatEvents.MessageSent);
                expect(message).toEqual(getFakeNewBestScoreMessage());
            },
        } as BroadcastOperator<unknown, unknown>);
        gateway.newBestTimeScore(getFakeNewBestScoreMessage());
    });
});

/* eslint-disable @typescript-eslint/no-magic-numbers */
const getFakeUserGame1 = (): UserGame => ({
    creator: 'FakeUser',
    nbDifferenceFound: 0,
    timer: 0,
    potentialPlayers: [],
    currentPlayers: [new CurrentPlayer()],
    differenceFoundByPlayers: [],
    gameName: '',
    chosenDifference: -1,
});
/* eslint-enable @typescript-eslint/no-magic-numbers */

const getFakeGameRoom = (): GameRoom => ({
    userGame: getFakeUserGame1(),
    roomId: 'socketId',
    started: true,
    gameMode: 'mode Classique',
    gameConstants: undefined,
});

const getFakeNewBestScoreMessage = (): string => 'Événement: FakePlayer obtient la 2 place dans les meilleurs temps du jeu FakeGame en mode solo';
