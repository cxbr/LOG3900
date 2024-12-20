/* eslint-disable @typescript-eslint/no-explicit-any */
// We need it to access private methods and properties in the test
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { DeleteDialogComponent } from '@app/components/delete-dialog/delete-dialog.component';
import { WaitingRoomComponent } from '@app/components/waiting-room-dialog/waiting-room-dialog.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { WaitingRoomService } from '@app/services/waiting-room/waiting-room.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('WaitingRoomComponent', () => {
    let component: WaitingRoomComponent;
    let fixture: ComponentFixture<WaitingRoomComponent>;
    let waitingRoomServiceSpy: WaitingRoomService;
    let dialog: MatDialog;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DeleteDialogComponent>>;
    let zone: NgZone;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;

    beforeEach(async () => {
        zone = new NgZone({ enableLongStackTrace: false });
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
        dialog = jasmine.createSpyObj('MatDialog', ['open']);
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [WaitingRoomComponent],
            providers: [
                WaitingRoomService,
                GameService,
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MatDialog, useValue: dialog },
                { provide: CommunicationSocketService, useValue: socketServiceMock },
            ],
            imports: [AppRoutingModule, MatSlideToggleModule, HttpClientTestingModule, MatDialogModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingRoomComponent);
        component = fixture.componentInstance;
        spyOn((component as any).waitingRoomService, 'removeSocketListeners').and.stub();
        waitingRoomServiceSpy = TestBed.inject(WaitingRoomService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set the rejected property when rejected$ event is triggered', () => {
        dialogRefSpy.afterClosed.and.returnValue(of(true));
        fixture.detectChanges();
        waitingRoomServiceSpy.rejected$.next(true);

        expect(component.rejected).toBe(true);
    });

    it('should start the game when accepted$ event is triggered', () => {
        spyOn(component, 'close').and.stub();

        fixture.detectChanges();
        waitingRoomServiceSpy.accepted$.next(true);

        expect(component.accepted).toBe(true);
        expect(component.close).toHaveBeenCalled();
    });

    it('should display an alert, abort the game and close the component when gameCanceled$ event is triggered', () => {
        spyOn(component, 'close').and.stub();
        (dialog.open as jasmine.Spy).and.returnValue(dialogRefSpy);
        dialogRefSpy.afterClosed.and.returnValue(of(true));
        component.gameCanceled = false;
        component.ngOnInit();
        waitingRoomServiceSpy.gameCanceled$.next(true);
        expect(dialog.open).toHaveBeenCalledWith(DeleteDialogComponent, {
            disableClose: true,
            data: { action: 'deleted' },
            panelClass: 'custom-modal',
        });
        expect(dialogRefSpy.afterClosed).toHaveBeenCalled();
        expect(component.close).toHaveBeenCalled();
    });

    it('should call classicModeService.playerAccepted with the given player', () => {
        spyOn(waitingRoomServiceSpy, 'playerAccepted');
        const player = 'ABC';
        const isAndroid = false;
        component.playerAccepted(player, isAndroid);
        expect(waitingRoomServiceSpy.playerAccepted).toHaveBeenCalledWith(player, isAndroid);
    });

    it('should call classicModeService.playerRejected with the given player', () => {
        spyOn(waitingRoomServiceSpy, 'playerRejected');
        const player = 'ABC';
        component.playerRejected(player);
        expect(waitingRoomServiceSpy.playerRejected).toHaveBeenCalledWith(player);
    });

    it('should unsubscribe from all subscriptions and close the dialog', () => {
        (dialog.open as jasmine.Spy).and.returnValue(dialogRefSpy);
        const acceptedSubscription = of(null).subscribe();
        const rejectedSubscription = of(null).subscribe();
        const gameCanceledSubscription = of(null).subscribe();
        spyOn((component as any).waitingRoomService, 'abortGame').and.stub();
        (component as any).acceptedSubscription = acceptedSubscription;
        (component as any).rejectedSubscription = rejectedSubscription;
        (component as any).gameCanceledSubscription = gameCanceledSubscription;
        zone.run(() => {
            component.close();
        });
        expect(acceptedSubscription.closed).toBeTrue();
        expect(rejectedSubscription.closed).toBeTrue();
        expect(gameCanceledSubscription.closed).toBeTrue();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
});
