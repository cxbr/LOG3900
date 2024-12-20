/* eslint-disable no-restricted-imports */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/compiler';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { ConfigHttpService } from '@app/services/config-http/config-http.service';
import { of } from 'rxjs';
import { ConfigParamsComponent } from '../config-params/config-params.component';
import { DynamicTestModule } from '../config-params/config-params.component.spec';
import { GameCardComponent } from '../game-card/game-card.component';
import { GameStatisticsComponent } from './game-statistics.component';
import SpyObj = jasmine.SpyObj;

describe('GameStatisticsComponent', () => {
    let component: GameStatisticsComponent;
    let fixture: ComponentFixture<GameStatisticsComponent>;
    let configHttpServiceSpy: SpyObj<ConfigHttpService>;
    beforeEach(async () => {
        configHttpServiceSpy = jasmine.createSpyObj('ConfigHttpService', ['getStatsUser']);

        configHttpServiceSpy.getStatsUser.and.returnValue(
            of({
                countGame: 0,
                countGameWin: 0,
                averageDiff: 0,
                averageTimer: 0,
            }),
        );

        TestBed.configureTestingModule({
            imports: [DynamicTestModule, RouterTestingModule, AppRoutingModule, CommonModule, HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            declarations: [ConfigParamsComponent, GameCardComponent],
            providers: [{ provide: ConfigHttpService, useValue: configHttpServiceSpy }],
        }).compileComponents();
    });
    beforeEach(async () => {
        fixture = TestBed.createComponent(GameStatisticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
