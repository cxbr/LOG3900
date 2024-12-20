import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePasswordDialogComponent } from './update-password-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

describe('UpdatePasswordDialogComponent', () => {
    let component: UpdatePasswordDialogComponent;
    let fixture: ComponentFixture<UpdatePasswordDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UpdatePasswordDialogComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: { gameFinished: false, gameWinner: true, time: 0 } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(UpdatePasswordDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
