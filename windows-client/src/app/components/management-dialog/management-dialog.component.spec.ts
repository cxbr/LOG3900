/* eslint-disable @typescript-eslint/no-explicit-any */
// We need it to access private methods and properties in the test
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { ManagementDialogComponent } from './management-dialog.component';

describe('ManagementDialogComponent', () => {
    let component: ManagementDialogComponent;
    let fixture: ComponentFixture<ManagementDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ManagementDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
            imports: [AppRoutingModule, ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(ManagementDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
