import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChatModalComponent } from './chat-modal.component';
import { GlobalChatService } from '@app/services/global-chat/global-chat.service';
import { ChatService } from '@app/services/chat/chat.service';

describe('ChatModalComponent', () => {
    let component: ChatModalComponent;
    let fixture: ComponentFixture<ChatModalComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ChatModalComponent>>;
    let globalChatServiceSpy: jasmine.SpyObj<GlobalChatService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    beforeEach(() => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close', 'open']);
        globalChatServiceSpy = jasmine.createSpyObj('GlobalChatService', [
            'getUserNickname',
            'getChannels',
            'joinChannel',
            'getSubscribedChannels',
            'leaveChannel',
            'refreshGlobalUserSubscribedChannels',
        ]);
        globalChatServiceSpy.getSubscribedChannels.and.returnValue(Promise.resolve([]));
        globalChatServiceSpy.refreshGlobalUserSubscribedChannels.and.stub();
        globalChatServiceSpy.currentChannel = null;
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['handleMessage', 'stopHandleMessage']);

        TestBed.configureTestingModule({
            declarations: [ChatModalComponent],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: GlobalChatService, useValue: globalChatServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatModalComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeDefined();
    });
});
