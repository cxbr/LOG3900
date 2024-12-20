import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { VideoReplayCardDialogComponent } from '@app/components/video-replay-card-dialog/video-replay-card-dialog.component';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { VideoReplayService } from '@app/services/video-replay/video-replay.service';
import { Replay } from '@common/classes/replay';
import { ReplayEvents } from '@common/enums/replay.gateway.variables';
@Component({
    selector: 'app-video-replay-card',
    templateUrl: './video-replay-card.component.html',
    styleUrls: ['./video-replay-card.component.scss'],
})
export class VideoReplayCardComponent implements OnInit {
    @Input() isOwnReplay: boolean;
    @Input() replay: Replay;
    @Output() deleteNotify = new EventEmitter();
    @Output() changeVisibilityNotify = new EventEmitter();
    dialogRef: MatDialogRef<VideoReplayCardDialogComponent>;
    likes: string[] = [];
    comments: Comment[] = [];
    nbLikes: number;
    nbComments: number;
    constructor(private socketService: CommunicationSocketService, private dialog: MatDialog, private videoReplayService: VideoReplayService) {}

    ngOnInit() {
        this.socketService.on(ReplayEvents.Likes, (data: { replayId: string; likes: string[] }) => {
            if (data.replayId === this.replay.id) {
                this.nbLikes = data.likes.length;
                this.likes = data.likes;
            }
        });
        this.socketService.on(ReplayEvents.Comments, (data: { replayId: string; comments: Comment[] }) => {
            if (data.replayId === this.replay.id) {
                this.nbComments = data.comments.length;
                this.comments = data.comments;
            }
        });

        this.socketService.send(ReplayEvents.Likes, this.replay.id);
        this.socketService.send(ReplayEvents.Comments, this.replay.id);
    }

    openReplayDialog(): void {
        this.videoReplayService.loadData(this.replay);
        this.dialogRef = this.dialog.open(VideoReplayCardDialogComponent, {
            disableClose: false,
            width: '95%',
            height: '95%',
            panelClass: 'custom-modal',
            data: { comments: this.comments, likes: this.likes, replayId: this.replay.id },
        });
    }

    deleteReplay(): void {
        this.deleteNotify.emit(this.replay.id);
    }

    changeVideoAccessibility(event: MatSlideToggleChange): void {
        this.changeVisibilityNotify.emit(this.replay.id);
        this.replay.public = event.checked;
    }
}
