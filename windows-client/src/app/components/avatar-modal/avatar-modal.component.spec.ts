import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChildrenOutletContexts, UrlSerializer } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CameraService } from '@app/services/camera/camera.service';
import { UserHttpService } from '@app/services/user-http/user-http.service';
import { of } from 'rxjs';
import { AvatarModalComponent } from './avatar-modal.component';

describe('AvatarModalComponent', () => {
    let component: AvatarModalComponent;
    let fixture: ComponentFixture<AvatarModalComponent>;

    const mockUserHttpService = jasmine.createSpyObj('UserHttpService', ['getPredefinedAvatars']);
    const mockCameraService = jasmine.createSpyObj('CameraService', ['accessCamera']);
    mockUserHttpService.getPredefinedAvatars.and.returnValue(of(['path1', 'path2']));

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AvatarModalComponent],
            imports: [RouterTestingModule],
            providers: [
                UrlSerializer,
                ChildrenOutletContexts,
                { provide: UserHttpService, useValue: mockUserHttpService },
                { provide: CameraService, useValue: mockCameraService },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AvatarModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
