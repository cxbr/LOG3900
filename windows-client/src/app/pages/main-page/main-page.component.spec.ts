import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let dialog: MatDialog;

    beforeEach(async () => {
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        await TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            imports: [AppRoutingModule, HttpClientTestingModule, MatDialogModule],
            providers: [{ provide: MatDialog, useValue: dialog }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
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

    it('ngOnDestory should close the dialog', () => {
        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        (dialog.open as jasmine.Spy).and.returnValue(dialogRefSpy);
        component.setGameMode('limited-game-mode');
        component.ngOnDestroy();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
});
