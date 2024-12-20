import { TestBed } from '@angular/core/testing';

import { MatDialogModule } from '@angular/material/dialog';
import { CameraService } from './camera.service';

describe('CameraService', () => {
    let service: CameraService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            providers: [CameraService],
        });
        service = TestBed.inject(CameraService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
