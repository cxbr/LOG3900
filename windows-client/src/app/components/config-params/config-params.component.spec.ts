import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfigParamsComponent } from '@app/components/config-params/config-params.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { GameSetupService } from '@app/services/game-setup/game-setup.service';
import { of } from 'rxjs';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

describe('ConfigParamsComponent', () => {
    let component: ConfigParamsComponent;
    let fixture: ComponentFixture<ConfigParamsComponent>;
    let configHttpService: jasmine.SpyObj<ConfigHttpService>;
    let gameSetUpService: jasmine.SpyObj<GameSetupService>;

    beforeEach(async () => {
        gameSetUpService = jasmine.createSpyObj('GameSetupService', ['setConstants', 'refreshGamesAfterReload']);
        gameSetUpService.setConstants.and.stub();
        configHttpService = jasmine.createSpyObj('ConfigHttpService', ['getConstants', 'updateConstants']);
        configHttpService.updateConstants.and.returnValue(of());
        configHttpService.getConstants.and.returnValue(of({ gameDuration: 30, penaltyTime: 5, bonusTime: 5, cheatMode: false }));
        await TestBed.configureTestingModule({
            declarations: [ConfigParamsComponent],
            imports: [HttpClientTestingModule, RouterTestingModule, AppRoutingModule, DynamicTestModule],
            providers: [
                { provide: ConfigHttpService, useValue: configHttpService },
                { provide: GameSetupService, useValue: gameSetUpService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfigParamsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should contain the value of the three game constants', () => {
        const gameDuration = component.gameDuration;
        const penaltyTime = component.penaltyTime;
        const bonusTime = component.bonusTime;
        expect(gameDuration).not.toBeUndefined();
        expect(penaltyTime).not.toBeUndefined();
        expect(bonusTime).not.toBeUndefined();
    });

    it('should call updateConstants to saveNewConstants', fakeAsync(() => {
        const constants = {
            gameDuration: 12,
            penaltyTime: 2,
            cheatMode: false,
            bonusTime: 3,
        };
        component.gameDuration = constants.gameDuration;
        component.penaltyTime = constants.penaltyTime;
        component.bonusTime = constants.bonusTime;
        component.applyNewConstants();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tick((component as any).timeout);
        expect(configHttpService.updateConstants).toHaveBeenCalledWith(constants);
        expect(gameSetUpService.setConstants).toHaveBeenCalledWith(constants);
    }));

    it('should call updateConstants to saveNewConstants', fakeAsync(() => {
        const resetConstants = {
            gameDuration: 30,
            penaltyTime: 5,
            bonusTime: 5,
            cheatMode: false,
        };
        component.gameDuration = 12;
        component.penaltyTime = 2;
        component.bonusTime = 3;
        component.resetConstants();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tick((component as any).timeout);
        expect(configHttpService.updateConstants).toHaveBeenCalledWith(resetConstants);
        expect(gameSetUpService.setConstants).toHaveBeenCalledWith(resetConstants);
    }));
});
