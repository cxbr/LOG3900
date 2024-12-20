/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { FriendService } from '@app/services/friend/friend.service';
import { UserService } from '@app/services/user/user.service';
import { of } from 'rxjs';
import { FriendDialogComponent } from './friend-dialog.component';

describe('FriendDialogComponent', () => {
    let component: FriendDialogComponent;
    let fixture: ComponentFixture<FriendDialogComponent>;
    let friendServiceSpy: jasmine.SpyObj<FriendService>;
    let userServiceSpy: jasmine.SpyObj<UserService>;

    beforeEach(async () => {
        userServiceSpy = jasmine.createSpyObj('UserService', ['getUserList']);
        friendServiceSpy = jasmine.createSpyObj('FriendService', ['seenFriendRequests']);
        userServiceSpy.getUserList.and.returnValue(of([]));
        friendServiceSpy.seenFriendRequests.and.stub();

        spyOn<FriendDialogComponent, any>(FriendDialogComponent.prototype, 'subscribeToSockets').and.stub();
        spyOn<FriendDialogComponent, any>(FriendDialogComponent.prototype, 'unsubscribeFromSockets').and.stub();

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: UserService, useValue: userServiceSpy },
                // { provide: CommunicationSocketService, useValue: {} },
                { provide: FriendService, useValue: friendServiceSpy },
            ],
            declarations: [FriendDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FriendDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
