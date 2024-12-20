import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UpdateUsernameDialogComponent } from './update-username-dialog.component';

describe('UpdateUsernameDialogComponent', () => {
    let component: UpdateUsernameDialogComponent;
    let fixture: ComponentFixture<UpdateUsernameDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UpdateUsernameDialogComponent],
            imports: [MatDialogModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: { gameFinished: false, gameWinner: true, time: 0 } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(UpdateUsernameDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
