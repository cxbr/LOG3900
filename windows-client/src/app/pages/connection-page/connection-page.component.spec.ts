import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { ConnectionPageComponent } from '@app/pages/connection-page/connection-page.component';

describe('ConnectionPageComponent', () => {
    let component: ConnectionPageComponent;
    let fixture: ComponentFixture<ConnectionPageComponent>;
    let dialog: MatDialog;

    beforeEach(async () => {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        await TestBed.configureTestingModule({
            declarations: [ConnectionPageComponent],
            imports: [AppRoutingModule, HttpClientTestingModule, MatDialogModule],
            providers: [{ provide: MatDialog, useValue: dialog }, FormBuilder],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have game logo', () => {
        const image = fixture.debugElement.nativeElement.querySelector('img');
        expect(image.src).toContain('/assets/pictures/logo.png');
    });
});
