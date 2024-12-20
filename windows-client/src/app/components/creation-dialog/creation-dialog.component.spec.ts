/* eslint-disable @typescript-eslint/no-explicit-any */
// We need it to access private methods and properties in the test
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { CreationDialogComponent } from '@app/components/creation-dialog/creation-dialog.component';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}
describe('CreationDialogComponent', () => {
    let component: CreationDialogComponent;
    let fixture: ComponentFixture<CreationDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, DynamicTestModule, RouterTestingModule, HttpClientTestingModule],
            declarations: [CreationDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreationDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngAfterViewInit should load image', (done) => {
        const drawImageSpy = spyOn(component as any, 'drawImage').and.stub();
        component.data.imageUrl = 'https://i.imgur.com/tG1K4kJ.jpeg';
        component.ngAfterViewInit();
        (component as any).image.dispatchEvent(new Event('load'));
        setTimeout(() => {
            expect(drawImageSpy).toHaveBeenCalled();
            done();
        }, 0);
    });

    it('should draw canvas', () => {
        component.data.imageUrl = 'https://i.imgur.com/9Z0QZ9A.png';
        const drawImageSpy = spyOn((component as any).context, 'drawImage').and.stub();
        const translateSpy = spyOn((component as any).context, 'translate').and.stub();
        const scaleSpy = spyOn((component as any).context, 'scale').and.stub();
        (component as any).drawImage(new Image());
        expect(drawImageSpy).toHaveBeenCalled();
        expect(translateSpy).not.toHaveBeenCalled();
        expect(scaleSpy).not.toHaveBeenCalled();
    });

    it('should show the right amount of differences', () => {
        component.data.nbDifferences = 5;
        fixture.detectChanges();
        const differences = fixture.nativeElement.querySelector('p');
        expect(differences.textContent).toContain('5');
    });
});
