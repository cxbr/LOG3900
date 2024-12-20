/* eslint-disable max-classes-per-file */
import { TestBed } from '@angular/core/testing';

import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameFinderService } from '@app/services/game-finder/game-finder.service';
import { Socket } from 'socket.io-client';

@NgModule({
    imports: [HttpClientModule, OverlayModule, MatDialogModule, BrowserAnimationsModule],
})
export class DynamicTestModule {}

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

describe('GameFinderService', () => {
    let service: GameFinderService;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    beforeEach(() => {
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        TestBed.configureTestingModule({
            imports: [AppRoutingModule, DynamicTestModule, RouterTestingModule, HttpClientTestingModule],
            providers: [{ provide: CommunicationSocketService, useValue: socketServiceMock }],
        });
        service = TestBed.inject(GameFinderService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
