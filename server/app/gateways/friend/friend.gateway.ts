// import { UserService } from '@app/services/user/user.service';
import { FriendEvents } from '@common/enums/friend.gateway.variables';
// import { Injectable, Logger } from '@nestjs/common';
// import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

import { Server, Socket } from 'socket.io';

import { UserService } from '@app/services/user/user.service';
import { UserProfile } from '@common/classes/user-profile';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

@WebSocketGateway({ cors: true })
@Injectable()
export class FriendGateway {
    @WebSocketServer() private server: Server;

    clients: Map<string, Socket> = new Map();

    constructor(private readonly logger: Logger, private readonly userService: UserService) {}

    @SubscribeMessage(FriendEvents.RegisterId)
    registerFriendId(socket: Socket, userId: string): void {
        this.clients.set(userId, socket);
    }

    @SubscribeMessage(FriendEvents.RemoveId)
    deregisterFriendId(socket: Socket, userId: string): void {
        this.clients.delete(userId);
    }

    @SubscribeMessage(FriendEvents.Request)
    sendFriendRequest(socket: Socket, idData: { from: string; to: string }): void {
        const userSocket: Socket = this.clients.get(idData.to);

        if (userSocket !== undefined) {
            userSocket.emit(FriendEvents.Request, idData.from);
        }
        socket.emit(FriendEvents.SentRequest, idData.to);
        this.userService.addFriendRequest(idData.from, idData.to);
        this.logger.log(`Friend request sent to ${idData.to} from ${idData.from}`);
    }

    @SubscribeMessage(FriendEvents.AcceptRequest)
    async acceptFriendRequest(socket: Socket, idData: { from: string; to: string }): Promise<void> {
        const userSocket: Socket = this.clients.get(idData.from);
        if (userSocket !== undefined) {
            userSocket.emit(FriendEvents.AcceptRequest, idData.to);
        }

        const hadSeenRequest: boolean = await this.userService.hasSeenFriendNotification(idData.from, idData.to);
        if (!hadSeenRequest) {
            socket.emit(FriendEvents.SeenOneRequest);
        }

        socket.emit(FriendEvents.AcceptRequest, idData.from);
        this.userService.removeFriendRequest(idData.from, idData.to);
        this.userService.addFriend(idData.from, idData.to);
        this.logger.log(`${idData.to} accepted friend request from ${idData.from}`);
    }

    @SubscribeMessage(FriendEvents.DeclineRequest)
    async declineFriendRequest(socket: Socket, idData: { from: string; to: string }): Promise<void> {
        const userSocket: Socket = this.clients.get(idData.from);
        if (userSocket !== undefined) {
            userSocket.emit(FriendEvents.DeclineRequest, idData.to);
        }

        const hadSeenRequest: boolean = await this.userService.hasSeenFriendNotification(idData.from, idData.to);
        if (!hadSeenRequest) {
            socket.emit(FriendEvents.SeenOneRequest);
        }

        socket.emit(FriendEvents.DeclineRequest, idData.from);
        this.userService.removeFriendRequest(idData.from, idData.to);
        this.logger.log(`${idData.to} declined friend request from ${idData.from}`);
    }

    @SubscribeMessage(FriendEvents.RemoveFriend)
    removeFriend(socket: Socket, idData: { from: string; to: string }): void {
        const userSocket: Socket = this.clients.get(idData.to);
        if (userSocket !== undefined) {
            userSocket.emit(FriendEvents.RemoveFriend, idData.from);
        }
        socket.emit(FriendEvents.RemoveFriend, idData.to);
        this.userService.removeFriend(idData.from, idData.to);
        this.logger.log(`${idData.from} removed ${idData.from} from friend list`);
    }

    @SubscribeMessage(FriendEvents.SeenRequests)
    onSeenRequests(socket: Socket, userId: string): void {
        this.userService.markAllFriendRequestsAsSeen(userId);
        socket.emit(FriendEvents.SeenRequests);
        this.logger.log(`${userId} has seen all friend requests`);
    }

    addNewUser(user: UserProfile) {
        this.server.emit(FriendEvents.AddNewUser, user);
        this.logger.log(`${user._id} has been added to the community`);
    }
}
