/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, NgModule } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { SocketTestHelper } from '@app/classes/socket-test-helper';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { GameScoreboardComponent } from '@app/components/game-scoreboard/game-scoreboard.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { VideoReplayDialogComponent } from '@app/components/video-replay-dialog/video-replay-dialog.component';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { GameService } from '@app/services/game/game.service';
import { GameData } from '@common/classes/game-data';
import { Subject } from 'rxjs';
import { Socket } from 'socket.io-client';

class SocketClientServiceMock extends CommunicationSocketService {
    override connect() {
        return;
    }
}

@NgModule({
    imports: [MatDialogModule, HttpClientModule],
})
export class DynamicTestModule {}

describe('VideoReplayDialogComponent', () => {
    let component: VideoReplayDialogComponent;
    let fixture: ComponentFixture<VideoReplayDialogComponent>;
    let socketServiceMock: SocketClientServiceMock;
    let socketHelper: SocketTestHelper;
    let gameService: jasmine.SpyObj<GameService>;
    const gameData: GameData = {
        name: '',
        nbDifference: 0,
        wantShoutout: true,
        creator: 'player1',
        image1url: 'https://picsum.photos/402',
        image2url: 'https://picsum.photos/204',
        difficulty: '',
        soloBestTimes: [],
        vsBestTimes: [],
        differenceMatrix: [[]],
        differenceHashMap: [],
    };

    beforeEach(async () => {
        gameService = jasmine.createSpyObj('GameService', [
            'changeTime',
            'sendServerValidate',
            'isLimitedTimeMode',
            'getIsTyping',
            'loadNextGame',
            'turnOffGameSocket',
        ]);
        gameService.gameData = gameData;
        gameService.serverValidateResponse$ = new Subject<DifferenceTry>();
        gameService.cheatModeResponse$ = new Subject<boolean>();
        socketHelper = new SocketTestHelper();
        socketServiceMock = new SocketClientServiceMock();
        (socketServiceMock as any).socket = socketHelper as unknown as Socket;
        await TestBed.configureTestingModule({
            declarations: [VideoReplayDialogComponent, GameScoreboardComponent, ChatBoxComponent, PlayAreaComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            imports: [MatProgressBarModule, HttpClientTestingModule, DynamicTestModule, RouterTestingModule],
            providers: [
                CommunicationSocketService,
                { provide: GameService, useValue: gameService },
                { provide: MAT_DIALOG_DATA, useValue: { penaltyTime: 2 } },
                { provide: CommunicationSocketService, useValue: socketServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VideoReplayDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
