import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { ThemeService } from '@app/services/theme/theme.service';
import { UserService } from '@app/services/user/user.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { AccountTabComponent } from './account-tab.component';

describe('AccountTabComponent', () => {
    let component: AccountTabComponent;
    let fixture: ComponentFixture<AccountTabComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, OverlayModule],
            providers: [
                { provide: MatDialog, useValue: {} },
                VerifyInputService,
                UserService,
                { provide: MatDialogRef, useValue: {} },
                { provide: ThemeService, useValue: { getIsDarkMode: () => true } },
            ],
            declarations: [AccountTabComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AccountTabComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
