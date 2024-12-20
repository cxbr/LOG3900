import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PicturePreviewPageComponent } from './picture-preview-page.component';

describe('PicturePreviewPageComponent', () => {
    let component: PicturePreviewPageComponent;
    let fixture: ComponentFixture<PicturePreviewPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PicturePreviewPageComponent],
            imports: [RouterTestingModule, HttpClientTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(PicturePreviewPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
