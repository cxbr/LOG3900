import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { UserService } from '@app/services/user/user.service';
import { Comment } from '@common/classes/replay';
import { ReplayEvents } from '@common/enums/replay.gateway.variables';
@Component({
    selector: 'app-video-replay-card-dialog',
    templateUrl: './video-replay-card-dialog.component.html',
    styleUrls: ['./video-replay-card-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class VideoReplayCardDialogComponent implements OnInit, OnDestroy {
    @ViewChild('commentsContainer') commentsContainer: ElementRef;

    comments: Comment[] = [];
    isReplayLiked: boolean = false;
    ownComment: string = '';
    userId: string = '';

    constructor(
        private socketService: CommunicationSocketService,
        private userService: UserService,
        @Inject(MAT_DIALOG_DATA) public data: { comments: Comment[]; likes: string[]; replayId: string },
    ) {}

    ngOnInit(): void {
        this.comments = this.data.comments;
        this.userId = this.userService.loggedInUser?._id ?? 'anon';
        this.isReplayLiked = this.data.likes.includes(this.userService.loggedInUser?._id ?? 'anon');
        this.socketService.on(ReplayEvents.Comment, (data: { comment: Comment; replayId: string }) => {
            if (data.replayId === this.data.replayId) {
                this.comments.push(data.comment);
            }
        });

        this.socketService.on(ReplayEvents.Like, (data: { replayId: string; userId: string }) => {
            if (data.replayId === this.data.replayId && data.userId === this.userId) {
                this.data.likes.push(data.userId);
                this.isReplayLiked = true;
            }
        });

        this.socketService.on(ReplayEvents.Unlike, (data: { replayId: string; userId: string }) => {
            if (data.replayId === this.data.replayId && data.userId === this.userId) {
                this.data.likes = this.data.likes.filter((id) => id !== data.userId);
                this.isReplayLiked = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.socketService.off(ReplayEvents.Comment);
        this.socketService.off(ReplayEvents.Like);
        this.socketService.off(ReplayEvents.Unlike);
    }

    convertTimeToDate(time: number): string {
        return ChatBoxComponent.convertTimeToDate(time);
    }

    updateLikes(): void {
        if (this.isReplayLiked) {
            this.socketService.send(ReplayEvents.Unlike, { replayId: this.data.replayId, userId: this.userId });
        } else {
            this.socketService.send(ReplayEvents.Like, { replayId: this.data.replayId, userId: this.userId });
        }
    }

    sendComment(): void {
        if (!this.ownComment) {
            return;
        }
        this.socketService.send(ReplayEvents.Comment, {
            replayId: this.data.replayId,
            userId: this.userId,
            comment: this.ownComment,
        });
        this.ownComment = '';

        setTimeout(() => {
            this.commentsContainer.nativeElement.scrollTop = this.commentsContainer.nativeElement.scrollHeight;
        }, 0);
    }

    scrollToBottom(): void {
        setTimeout(() => {
            this.commentsContainer.nativeElement.scrollTop = this.commentsContainer.nativeElement.scrollHeight;
        }, 0);
    }
}
