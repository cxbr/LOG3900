/* eslint-disable max-lines */
import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { GameFinderService } from '@app/services/game-finder/game-finder.service';
import { GameSetupService } from '@app/services/game-setup/game-setup.service';
import { UserService } from '@app/services/user/user.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { Subject } from 'rxjs';
import { PageKeys, options } from 'src/assets/variables/game-card-options';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

describe('GameCardComponent', () => {
    const differenceMatrix: number[][] = [[]];

    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let gameFinderService: jasmine.SpyObj<GameFinderService>;
    let gameSetupService: jasmine.SpyObj<GameSetupService>;
    let verifyService: jasmine.SpyObj<VerifyInputService>;
    let userService: jasmine.SpyObj<UserService>;

    beforeEach(async () => {
        gameFinderService = jasmine.createSpyObj('GameFinderService', ['checkGame', 'gameExists$', 'connectSocket']);
        gameFinderService.gameExists$ = new Subject<boolean>();
        gameSetupService = jasmine.createSpyObj('GameSetupService', ['getSlides', 'joinGame', 'initGameRoom', 'initGameMode']);
        verifyService = jasmine.createSpyObj('VerifyInputService', ['verify']);
        userService = jasmine.createSpyObj('UserService', ['getToken', 'getCurrentUserId', 'getAverageRating']);
        TestBed.configureTestingModule({
            declarations: [GameCardComponent],
            imports: [AppRoutingModule, DynamicTestModule, RouterTestingModule, HttpClientTestingModule],
            providers: [
                { provide: GameFinderService, useValue: gameFinderService },
                { provide: GameSetupService, useValue: gameSetupService },
                { provide: VerifyInputService, useValue: verifyService },
                { provide: MatDialog },
                { provide: UserService, useValue: userService },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
        component.page = PageKeys.Management;
        component.slide = {
            name: 'Find the Differences 1',
            nbDifference: 10,
            wantShoutout: true,
            creator: 'player1',
            image1url: 'https://example.com/image1.jpg',
            image2url: 'https://example.com/image2.jpg',
            difficulty: 'easy',
            differenceHashMap: [],
            soloBestTimes: [
                { name: 'player1', time: 200 },
                { name: 'player2', time: 150 },
                { name: 'player3', time: 150 },
            ],
            vsBestTimes: [
                { name: 'player1', time: 200 },
                { name: 'player2', time: 150 },
                { name: 'player3', time: 150 },
            ],
            differenceMatrix,
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('slide should have name', () => {
        expect(component.slide.name).toBeTruthy();
    });

    it('should have game image', () => {
        const image = fixture.debugElement.nativeElement.querySelector('img');
        expect(image.src).toEqual('https://example.com/image1.jpg');
    });

    it('slide should have difficulty', () => {
        expect(component.slide.difficulty).toBeTruthy();
    });

    it('should have three best solo scores', () => {
        expect(component.slide.soloBestTimes.length).toEqual(3);
    });

    it('should have three best 1v1 scores', () => {
        expect(component.slide.vsBestTimes.length).toEqual(3);
    });

    it('should have play button for solo mode', () => {
        const btn1 = fixture.debugElement.nativeElement.getElementsByTagName('button')[0];
        expect(btn1).not.toBeUndefined();
    });

    it('should set the correct properties when the page is Config', () => {
        component.ngOnInit();
        expect(component.routeOne).toEqual(options.management.routeOne);
        expect(component.btnOne).toEqual(options.management.btnOne);
    });

    it('should set the correct properties when the page is Selection', () => {
        component.page = PageKeys.Selection;
        component.ngOnInit();
        expect(component.routeOne).toEqual(options.selection.routeOne);
        expect(component.btnOne).toEqual(options.selection.btnOne);
    });

    it('should emit the slide name when onCardSelect is called', () => {
        const emitSpy = spyOn(component.notifySelected, 'emit');
        component.onCardSelect();
        expect(emitSpy).toHaveBeenCalledWith(component.slide.name);
    });

    it('should add best times to the slide', () => {
        expect(component.slide.soloBestTimes.length).toEqual(3);
        expect(component.slide.vsBestTimes.length).toEqual(3);
    });

    it('should emit the correct object when deleteCard is called', () => {
        const spy = spyOn(component.deleteNotify, 'emit');
        component.deleteCard();
        expect(spy).toHaveBeenCalledWith(component.slide.name);
    });

    it('should emit the correct object when resetCard is called', () => {
        const spy = spyOn(component.resetNotify, 'emit');
        component.resetCard();
        expect(spy).toHaveBeenCalledWith(component.slide.name);
    });

    it('should call gameSetupService joinGame if joinGame is called', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
        (component as any).dialogRef = { close: () => {} } as MatDialogRef<WaitingRoomComponent>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const waitingRoomSpy = spyOn((component as any).dialog, 'open');
        const notifySpy = spyOn(component.notify, 'emit');
        component.joinGame();
        expect(notifySpy).toHaveBeenCalledWith(component.slide);
        expect(waitingRoomSpy).toHaveBeenCalledWith(WaitingRoomComponent, {
            disableClose: true,
            width: '80%',
            height: '80%',
            panelClass: 'custom-modal',
        });
    });

    it('should close the dialog on ngOnDestroy', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
        (component as any).dialogRef = { close: () => {} } as MatDialogRef<WaitingRoomComponent>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spy = spyOn((component as any).dialogRef, 'close').and.stub();
        component.ngOnDestroy();
        expect(spy).toHaveBeenCalled();
    });
});
