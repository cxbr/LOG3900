import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatButtonComponent } from './chat-button.component';
import { MatDialog } from '@angular/material/dialog';
import { GlobalChatService } from '@app/services/global-chat/global-chat.service';

describe('ChatButtonComponent', () => {
    let component: ChatButtonComponent;
    let fixture: ComponentFixture<ChatButtonComponent>;
    let globalChatServiceSpy: jasmine.SpyObj<GlobalChatService>;

    beforeEach(async () => {
        globalChatServiceSpy = jasmine.createSpyObj('GlobalChatService', ['getUserNickname', 'getChannels', 'joinChannel']);
        globalChatServiceSpy.userSubscribedChannels = [];

        await TestBed.configureTestingModule({
            declarations: [ChatButtonComponent],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: GlobalChatService, useValue: globalChatServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
