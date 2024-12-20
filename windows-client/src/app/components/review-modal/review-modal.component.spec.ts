import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewModalComponent } from './review-modal.component';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { OverlayModule } from '@angular/cdk/overlay';
@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}
describe('ReviewModalComponent', () => {
    let component: ReviewModalComponent;
    let fixture: ComponentFixture<ReviewModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReviewModalComponent],
            imports: [FormsModule, DynamicTestModule, RouterTestingModule, HttpClientTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(ReviewModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
