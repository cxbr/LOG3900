import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { VideoReplayPageComponent } from './video-replay-page.component';

describe('VideoReplayPageComponent', () => {
    let component: VideoReplayPageComponent;
    let fixture: ComponentFixture<VideoReplayPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoReplayPageComponent],
            imports: [HttpClientTestingModule, RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(VideoReplayPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
