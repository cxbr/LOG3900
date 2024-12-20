/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
// We need it to access private methods and properties in the test
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { CommunicationHttpService } from '@app/services/communication-http/communication-http.service';
import { of } from 'rxjs';
import { PageKeys } from 'src/assets/variables/game-card-options';
import { SelectPageComponent } from './select-page.component';
import SpyObj = jasmine.SpyObj;

@NgModule({
    imports: [MatDialogModule, HttpClientModule],
})
export class DynamicTestModule {}

describe('SelectPageComponent', () => {
    let component: SelectPageComponent;
    let fixture: ComponentFixture<SelectPageComponent>;
    let communicationServiceSpy: SpyObj<CommunicationHttpService>;
    let dialog: MatDialog;
    let dialogRefSpy: SpyObj<MatDialogRef<DeleteDialogComponent>>;

    beforeEach(async () => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getAllGames']);
        communicationServiceSpy.getAllGames.and.returnValue(
            of([
                {
                    name: 'Find the Differences 1',

                    nbDifference: 10,
                    wantShoutout: true,
                    creator: 'player1',
                    image1url: 'https://example.com/image1.jpg',
                    image2url: 'https://example.com/image2.jpg',
                    difficulty: 'easy',
                    soloBestTimes: [
                        { name: 'player1', time: 200 },
                        { name: 'player2', time: 150 },
                    ],
                    vsBestTimes: [{ name: 'player1', time: 200 }],
                    differenceMatrix: [[]],
                    differenceHashMap: [],
                    isSelected: false,
                },
                {
                    name: 'Find the Differences 2',

                    nbDifference: 15,
                    wantShoutout: true,
                    creator: 'player1',
                    image1url: 'https://example.com/image3.jpg',
                    image2url: 'https://example.com/image4.jpg',
                    difficulty: 'medium',
                    soloBestTimes: [
                        { name: 'player3', time: 300 },
                        { name: 'player4', time: 250 },
                    ],
                    vsBestTimes: [{ name: 'player3', time: 200 }],
                    differenceMatrix: [[]],
                    differenceHashMap: [],
                    isSelected: false,
                },
            ]),
        );
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            imports: [DynamicTestModule, RouterTestingModule, AppRoutingModule, CommonModule, HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            declarations: [SelectPageComponent, GameCardComponent],
            providers: [
                { provide: CommunicationHttpService, useValue: communicationServiceSpy },
                { provide: MatDialog, useValue: dialog },
            ],
        }).compileComponents();
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        (dialog.open as jasmine.Spy).and.returnValue(dialogRefSpy);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SelectPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should contain a carousel', () => {
        const carousel = fixture.debugElement.query(By.css('.carousel')).nativeElement;
        expect(carousel).not.toBeUndefined();
    });

    it('should have slides in the carousel', () => {
        expect(component.slides.length).toEqual(2);
    });

    it('should show up to 2 slides at a time', () => {
        const slidesToShow = 2;
        expect(component.slideConfig.slidesToShow).toEqual(slidesToShow);
    });

    it('getSlidesFromServer should set noGames to true if getAllGames return empty list', () => {
        component.pageType = PageKeys.Management;
        communicationServiceSpy.getAllGames.and.returnValue(of([]));
        (component as any).getSlidesFromServer();
        expect(communicationServiceSpy.getAllGames).toHaveBeenCalled();
        expect(component.slides.length).toEqual(0);
        expect(component.noGames).toBeTrue();
    });

    it('getSlidesFromServer should call getAllGames and set the slides', () => {
        (component as any).getSlidesFromServer();
        expect(communicationServiceSpy.getAllGames).toHaveBeenCalled();
        expect(component.slides.length).toEqual(2);
        expect(component.noGames).toBeFalse();
    });
});
