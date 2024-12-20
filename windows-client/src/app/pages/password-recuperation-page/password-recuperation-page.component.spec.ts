import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PasswordRecuperationPageComponent } from './password-recuperation-page.component';
import { RouterTestingModule } from '@angular/router/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import { UserService } from '@app/services/user/user.service';
import { FormBuilder } from '@angular/forms';

describe('PasswordRecuperationPageComponent', () => {
    let component: PasswordRecuperationPageComponent;
    let fixture: ComponentFixture<PasswordRecuperationPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, OverlayModule],
            providers: [{ provide: MatDialog, useValue: {} }, UserService, { provide: MatDialogRef, useValue: {} }, FormBuilder],
            declarations: [PasswordRecuperationPageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PasswordRecuperationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
