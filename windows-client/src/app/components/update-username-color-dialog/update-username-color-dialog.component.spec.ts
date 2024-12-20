import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUsernameColorDialogComponent } from './update-username-color-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('UpdateUsernameColorDialogComponent', () => {
    let component: UpdateUsernameColorDialogComponent;
    let fixture: ComponentFixture<UpdateUsernameColorDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: { isColorUpdated: false } },
            ],
            declarations: [UpdateUsernameColorDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(UpdateUsernameColorDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
