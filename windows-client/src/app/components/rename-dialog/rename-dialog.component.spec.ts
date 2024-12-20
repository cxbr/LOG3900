/* eslint-disable @typescript-eslint/no-explicit-any */
// We need it to access private methods and properties in the test
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { RenameDialogComponent } from './rename-dialog.component';

describe('RenameDialogComponent', () => {
    let component: RenameDialogComponent;
    let fixture: ComponentFixture<RenameDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RenameDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: { deleted: false } },
            ],
            imports: [AppRoutingModule, ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(RenameDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
