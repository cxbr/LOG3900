import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { UserService } from '@app/services/user/user.service';
import { FriendService } from './friend.service';

describe('FriendService', () => {
    let service: FriendService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: UserService, useValue: {} },
                { provide: CommunicationSocketService, useValue: {} },
            ],
        });
        service = TestBed.inject(FriendService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
