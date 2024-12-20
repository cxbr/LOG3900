import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { CameraPageComponent } from './camera-page.component';

describe('CameraPageComponent', () => {
    let component: CameraPageComponent;
    let fixture: ComponentFixture<CameraPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CameraPageComponent],
            imports: [RouterTestingModule, MatDialogModule],
        }).compileComponents();

        fixture = TestBed.createComponent(CameraPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
