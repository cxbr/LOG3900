import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { ChannelData } from '@app/interfaces/channel-data';
import { ChatService } from '@app/services/chat/chat.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { Message } from '@common/classes/chat-message';
import { GameConstants } from '@common/classes/game-constants';
import { GameRoom } from '@common/classes/game-room';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let messageStub: Message;
    let gameRoom: GameRoom;
    let chatService: ChatService;

    beforeEach(async () => {
        gameRoom = {
            userGame: {
                gameName: '',
                chosenDifference: -1,
                nbDifferenceFound: 0,
                timer: 0,
                creator: 'Test',
                currentPlayers: [{ username: 'Test', isAndroid: false }],
                differenceFoundByPlayers: [],
            },
            roomId: 'channelId',
            started: false,
            gameMode: 'mode Classique',
            gameConstants: undefined as unknown as GameConstants,
        };
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        messageStub = { message: 'message', username: 'username', time: 0, isAndroid: false };
        await TestBed.configureTestingModule({
            declarations: [ChatBoxComponent],
            providers: [
                CommunicationSocketService,
                ChatService,
                VerifyInputService,
                { provide: CommunicationSocketService, useValue: socketServiceMock },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        chatService = TestBed.inject(ChatService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should subscribe to chatService.message$', () => {
        const messageSubSpy = spyOn(chatService.message$, 'subscribe').and.callThrough();
        component.ngOnInit();
        chatService.message$.next(messageStub);
        expect(messageSubSpy).toHaveBeenCalled();
        expect(component.messages).toContain(messageStub);
    });

    it('should call chatService.sendMessage() when sendMessage() is called and verify return true', () => {
        const verifyService = TestBed.inject(VerifyInputService);
        const verifySpy = spyOn(verifyService, 'verify').and.returnValue(true);
        const sendMessageSpy = spyOn(chatService, 'sendMessage').and.stub();
        component.message = 'message';
        component.username = 'username';
        component.channel = new ChannelData('channelId', 'displayName');
        // Create a mock event with preventDefault() method
        const event = {
            preventDefault: () => {
                return;
            },
        } as Event;
        component.sendMessage(event);
        expect(verifySpy).toHaveBeenCalledWith('message');
        expect(sendMessageSpy).toHaveBeenCalledWith('message', 'username', gameRoom.roomId);
    });

    it("shouldn't call chatService.sendMessage() when sendMessage() is called and verify return false", () => {
        const verifyService = TestBed.inject(VerifyInputService);
        const verifySpy = spyOn(verifyService, 'verify').and.returnValue(false);
        const sendMessageSpy = spyOn(chatService, 'sendMessage').and.stub();
        component.message = 'message';
        component.username = 'username';
        component.channel = new ChannelData('channelId', 'displayName');
        // Create a mock event with preventDefault() method
        const event = {
            preventDefault: () => {
                return;
            },
        } as Event;
        component.sendMessage(event);
        expect(verifySpy).toHaveBeenCalledWith('message');
        expect(sendMessageSpy).not.toHaveBeenCalledWith('message', 'username', gameRoom.roomId);
    });

    it('should call chatService.setIsTyping when chatInputFocus is called', () => {
        const setIsTypingSpy = spyOn(chatService, 'setIsTyping').and.stub();
        component.chatInputFocus();
        expect(setIsTypingSpy).toHaveBeenCalledWith(true);
    });

    it('should call chatService.setIsTyping when chatInputBlur is called', () => {
        const setIsTypingSpy = spyOn(chatService, 'setIsTyping').and.stub();
        component.chatInputBlur();
        expect(setIsTypingSpy).toHaveBeenCalledWith(false);
    });
});
