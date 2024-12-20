/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { FriendService } from '@app/services/friend/friend.service';
import { UserService } from '@app/services/user/user.service';
import { of } from 'rxjs';
import { FriendButtonComponent } from './friend-button.component';

describe('FriendButtonComponent', () => {
    let component: FriendButtonComponent;
    let fixture: ComponentFixture<FriendButtonComponent>;

    let userServiceSpy: jasmine.SpyObj<UserService>;
    let friendServiceSpy: jasmine.SpyObj<FriendService>;

    beforeEach(async () => {
        userServiceSpy = jasmine.createSpyObj('UserService', ['getFriendNotificationCount']);
        friendServiceSpy = jasmine.createSpyObj('FriendService', ['registerSocketEvents', 'deregisterSocketEvents']);
        userServiceSpy.getFriendNotificationCount.and.returnValue(of(0));

        spyOn<FriendButtonComponent, any>(FriendButtonComponent.prototype, 'subscribeToSockets').and.stub();
        spyOn<FriendButtonComponent, any>(FriendButtonComponent.prototype, 'unsubscribeFromSockets').and.stub();

        await TestBed.configureTestingModule({
            declarations: [FriendButtonComponent],
            providers: [
                { provide: UserService, useValue: userServiceSpy },
                { provide: FriendService, useValue: friendServiceSpy },
                { provide: MatDialog, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(FriendButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
