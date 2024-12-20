import { UpdateUsernameColor } from '@app/model/dto/user/update-username-color';
import { ChatRoom } from '@app/model/schema/chat-room';
import { ChatService } from '@app/services/chat/chat.service';
import { UserService } from '@app/services/user/user.service';
import { UserEvents } from '@common/enums/user.gateway.variables';
import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// TODO: REFACTOR TO REMOVE THIS IT CAN SLOW DOWN PERFORMANCE
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
require('events').EventEmitter.prototype._maxListeners = 100;
@WebSocketGateway({ cors: true })
@Injectable()
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() private server: Server;

    constructor(private readonly logger: Logger, private readonly userService: UserService, private readonly chatPersistenceService: ChatService) {}
    get channelsAndUsers(): Map<string, ChatRoom> {
        return this.chatPersistenceService.channels;
    }
    @SubscribeMessage(UserEvents.UserConnected)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectUser(socket: Socket, data: { username: string; isConnectedToAndroid: boolean }): void {
        this.userService.addActiveUser(data.username, socket.id, data.isConnectedToAndroid);
        if (data.isConnectedToAndroid) {
            this.userService.getUserByUsername(data.username).then(async (user) => {
                if (user) {
                    const channelsToSend = this.getChannelsAsObjectToSend()
                        .filter((channel) => user.joinedChannels.find((joinedChannel) => joinedChannel.channelId === channel.channelId))
                        .map((channel) => channel.displayName);
                    this.userService.writeLastConnectionAndroid(data.username, channelsToSend);
                }
            });
        }
        this.logger.log(`UserGateway: user ${data.username} connected`);
    }

    @SubscribeMessage(UserEvents.UserDisconnected)
    disconnectUser(socket: Socket): void {
        this.userService.disconnectUser(socket.id);
        this.logger.log(`UserGateway: user ${socket.id} disconnected`);
    }

    @SubscribeMessage(UserEvents.IsUserConnected)
    isUserConnected(socket: Socket, username: string): void {
        this.logger.log(`UserGateway: checking if user ${username} is connected`);
        this.server.to(socket.id).emit(UserEvents.IsUserConnected, this.userService.isUserActive(username));
    }

    @SubscribeMessage(UserEvents.UsernameColorUpdated)
    updateUsernameColor(socket: Socket, updateUsernameColorDto: UpdateUsernameColor): void {
        this.userService.updateUsernameColor(updateUsernameColorDto);
        this.logger.log(`UserGateway: user ${updateUsernameColorDto.userId} updated username color to ${updateUsernameColorDto.usernameColor}`);
        this.server.emit(UserEvents.UsernameColorUpdated, updateUsernameColorDto);
    }

    handleDisconnect(socket: Socket) {
        const username = this.userService.getUsernameBySocketId(socket.id);
        this.userService.disconnectUser(socket.id);
        this.logger.log(`UserGateway: user ${socket.id} | ${username} disconnected`);
    }

    handleConnection(socket: Socket) {
        this.logger.log(`UserGateway: user ${socket.id} connected`);
    }
    getChannelsAsObjectToSend(): { channelId: string; displayName: string; numberOfUnreadMessages: number; isPrivate: boolean }[] {
        return Object.keys(this.channelsAndUsers).map((channel) => {
            return {
                channelId: channel,
                displayName: this.channelsAndUsers[channel].displayName,
                numberOfUnreadMessages: 0,
                isPrivate: this.channelsAndUsers[channel].isPrivate,
            };
        });
    }
}
