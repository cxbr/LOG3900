/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FriendService } from '@app/services/friend/friend.service';
import { UserService } from '@app/services/user/user.service';
import { ProfileDialogComponent } from './profile-dialog.component';

describe('ProfileDialogComponent', () => {
    let component: ProfileDialogComponent;
    let fixture: ComponentFixture<ProfileDialogComponent>;

    beforeEach(async () => {
        spyOn<ProfileDialogComponent, any>(ProfileDialogComponent.prototype, 'refreshDialog').and.stub();

        const userStub = { _id: '', username: '', avatar: '', state: '' };

        await TestBed.configureTestingModule({
            declarations: [ProfileDialogComponent],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: FriendService, useValue: {} },
                { provide: UserService, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileDialogComponent);
        component = fixture.componentInstance;
        component.user = userStub;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
