import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AvatarService } from '@app/services/avatar/avatar.service';
import { UserService } from '@app/services/user/user.service';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
    let component: AvatarComponent;
    let fixture: ComponentFixture<AvatarComponent>;

    const mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);
    const mockAvatarService = jasmine.createSpyObj('AvatarService', ['getAvatar', 'setLocalAvatar', 'setNetworkAvatar']);
    const mockUserService = jasmine.createSpyObj('UserService', ['setAvatar']);

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AvatarComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: AvatarService, useValue: mockAvatarService },
                { provide: UserService, useValue: mockUserService },
                { provide: MatDialogRef, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
