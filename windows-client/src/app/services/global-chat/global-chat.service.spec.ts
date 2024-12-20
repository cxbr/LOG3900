import { TestBed } from '@angular/core/testing';

import { GlobalChatService } from '@app/services/global-chat/global-chat.service';
import { UserService } from '@app/services/user/user.service';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { Socket } from 'socket.io-client';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('GlobalChatService', () => {
    let service: GlobalChatService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, MatDialogModule],
            providers: [UserService, CommunicationSocketService, { provide: CommunicationSocketService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(GlobalChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
