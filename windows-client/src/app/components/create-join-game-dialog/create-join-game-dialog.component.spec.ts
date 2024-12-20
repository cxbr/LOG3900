import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { CreateJoinGameDialogComponent } from '@app/components/create-join-game-dialog/create-join-game-dialog.component';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { GameFinderService } from '@app/services/game-finder/game-finder.service';
import { GameSetupService } from '@app/services/game-setup/game-setup.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { GameMode } from '@common/game-mode';
import { Subject } from 'rxjs';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

describe('CreateJoinGameDialogComponent', () => {
    let component: CreateJoinGameDialogComponent;
    let fixture: ComponentFixture<CreateJoinGameDialogComponent>;
    let gameFinderService: jasmine.SpyObj<GameFinderService>;
    let gameSetupService: jasmine.SpyObj<GameSetupService>;
    let verifyService: jasmine.SpyObj<VerifyInputService>;

    beforeEach(async () => {
        gameFinderService = jasmine.createSpyObj('GameFinderService', ['checkGame', 'gameExists$', 'connectSocket', 'attemptToJoinGame', 'getGames']);
        gameFinderService.gameExists$ = new Subject<boolean>();
        gameFinderService.getGames.and.returnValue(new Subject());
        gameSetupService = jasmine.createSpyObj('GameSetupService', ['getSlides', 'joinGame', 'initGameRoom', 'initGameMode', 'getAllGames']);
        verifyService = jasmine.createSpyObj('VerifyInputService', ['verify']);

        await TestBed.configureTestingModule({
            declarations: [CreateJoinGameDialogComponent],
            imports: [AppRoutingModule, DynamicTestModule, RouterTestingModule, HttpClientTestingModule],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                { provide: MatDialog },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: GameFinderService, useValue: gameFinderService },
                { provide: GameSetupService, useValue: gameSetupService },
                { provide: VerifyInputService, useValue: verifyService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateJoinGameDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('createGame should call gameSetupService initGameRoom and initGameMode', () => {
        gameSetupService.initGameMode.and.returnValue(true);
        gameSetupService.initGameRoom.and.stub();
        // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-explicit-any
        (component as any).dialogRef = { close: () => {} } as MatDialogRef<CreateJoinGameDialogComponent>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dialogRefCloseSpy = spyOn((component as any).dialogRef, 'close').and.stub();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const waitingRoomSpy = spyOn((component as any).dialog, 'open');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).data = { gameName: 'Test', gameMode: GameMode.classicMode };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (component as any).createGame();
        expect(gameSetupService.initGameRoom).toHaveBeenCalledWith(false);
        expect(gameSetupService.initGameMode).toHaveBeenCalledWith('Test');
        expect(dialogRefCloseSpy).toHaveBeenCalled();
        expect(waitingRoomSpy).toHaveBeenCalledWith(WaitingRoomComponent, {
            disableClose: true,
            width: '80%',
            height: '80%',
            panelClass: 'custom-modal',
        });
    });
});
