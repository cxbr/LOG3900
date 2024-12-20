import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { SignupPageComponent } from '@app/pages/signup-page/signup-page.component';

describe('SignupPageComponent', () => {
    let component: SignupPageComponent;
    let fixture: ComponentFixture<SignupPageComponent>;
    let dialog: MatDialog;

    beforeEach(async () => {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        await TestBed.configureTestingModule({
            declarations: [SignupPageComponent],
            imports: [AppRoutingModule, HttpClientTestingModule, MatDialogModule],
            providers: [{ provide: MatDialog, useValue: dialog }, FormBuilder],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SignupPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
