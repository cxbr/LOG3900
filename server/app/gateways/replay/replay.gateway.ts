import { ReplayService } from '@app/services/replay/replay.service';
import { ReplayEvents } from '@common/enums/replay.gateway.variables';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: true })
@Injectable()
export class ReplayGateway {
    @WebSocketServer() private server: Server;

    constructor(private readonly logger: Logger, private readonly replayService: ReplayService) {}

    @SubscribeMessage(ReplayEvents.Comment)
    async comment(socket: Socket, data: { comment: string; replayId: string; userId: string }): Promise<void> {
        const comments = this.replayService.comment(data.comment, data.replayId, data.userId);
        this.logger.log(`ReplayGateway: Comment ${data.comment} replayId: ${data.replayId} userId: ${data.userId}`);
        this.server.emit(ReplayEvents.Comment, { replayId: data.replayId, comment: comments[comments.length - 1] });
        this.server.emit(ReplayEvents.Comments, { replayId: data.replayId, comments });
    }

    @SubscribeMessage(ReplayEvents.Like)
    async like(socket: Socket, data: { replayId: string; userId: string }): Promise<void> {
        const likes = this.replayService.like(data.replayId, data.userId);
        this.logger.log(`ReplayGateway: ${data.userId} liked ${data.replayId}`);
        this.server.emit(ReplayEvents.Like, { replayId: data.replayId, userId: data.userId });
        this.server.emit(ReplayEvents.Likes, { replayId: data.replayId, likes });
    }

    @SubscribeMessage(ReplayEvents.Unlike)
    async unlike(socket: Socket, data: { replayId: string; userId: string }): Promise<void> {
        const likes = this.replayService.unlike(data.replayId, data.userId);
        this.logger.log(`ReplayGateway: ${data.userId} unLiked ${data.replayId}`);
        this.server.emit(ReplayEvents.Unlike, { replayId: data.replayId, userId: data.userId });
        this.server.emit(ReplayEvents.Likes, { replayId: data.replayId, likes });
    }

    @SubscribeMessage(ReplayEvents.Comments)
    async comments(socket: Socket, replayId: string): Promise<void> {
        const comments = this.replayService.getComments(replayId);
        this.logger.log(`ReplayGateway: Comments ${comments.length} of ${replayId}`);
        this.server.to(socket.id).emit(ReplayEvents.Comments, { replayId, comments });
    }

    @SubscribeMessage(ReplayEvents.Likes)
    async likes(socket: Socket, replayId: string): Promise<void> {
        const likes = this.replayService.getLikes(replayId);
        this.logger.log(`ReplayGateway: Likes ${likes} of ${replayId}`);
        this.server.to(socket.id).emit(ReplayEvents.Likes, { replayId, likes });
    }
}
