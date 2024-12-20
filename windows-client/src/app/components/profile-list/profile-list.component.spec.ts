import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog } from '@angular/material/dialog';
import { FriendService } from '@app/services/friend/friend.service';
import { ProfileListComponent } from './profile-list.component';

describe('ProfileListComponent', () => {
    let component: ProfileListComponent;
    let fixture: ComponentFixture<ProfileListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProfileListComponent],
            providers: [
                { provide: MatDialog, useValue: {} },
                { provide: FriendService, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
