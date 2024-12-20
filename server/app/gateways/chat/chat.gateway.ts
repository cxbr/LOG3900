import { ChatRoom } from '@app/model/schema/chat-room';
import { ChatService } from '@app/services/chat/chat.service';
import { TokenService } from '@app/services/firebase/token.service';
import { UserService } from '@app/services/user/user.service';
import { Message } from '@common/classes/chat-message';
import { ChatEvents } from '@common/enums/chat.gateway.variables';
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class ChatGateway {
    @WebSocketServer() private server: Server;

    mainChannel = 'home';

    // eslint-disable-next-line max-params
    constructor(
        private readonly logger: Logger,
        private readonly chatPersistenceService: ChatService,
        private readonly userService: UserService,
        private tokenService: TokenService,
    ) {}

    get channelsAndUsers(): Map<string, ChatRoom> {
        return this.chatPersistenceService.channels;
    }

    @SubscribeMessage(ChatEvents.RequestSendMessage)
    async sendMessage(socket: Socket, data: { message: string; username: string; roomId: string; isAndroid: boolean }): Promise<void> {
        const messageObject: Message = { message: data.message, username: data.username, time: Date.now(), isAndroid: data.isAndroid };
        let usernameAndroid = 'aucun';
        let channelUsers;
        if (data.roomId === '') this.server.emit(ChatEvents.MessageSent, messageObject);
        else this.server.to(data.roomId).emit(ChatEvents.MessageSent, messageObject);

        // Iterate through all the sockets in the channel and send the message to each of them
        // If the roomId is empty, it means the message was already sent to everyone
        if (this.channelsAndUsers[data.roomId] && data.roomId !== '') {
            this.channelsAndUsers[data.roomId].connectedUsers.forEach((channelUser) => {
                // If the socket is already in the room, don't send the message to it because
                // it will already receive it thanks to server.to(data.roomId).emit...
                // First get the room that has roomId as its id
                const room = this.server.sockets.adapter.rooms.get(data.roomId);
                // Then check if the socket is in the room
                if (room && room.has(channelUser.socket.id)) return;

                channelUser.socket.emit(ChatEvents.MessageSent, messageObject);
            });
            this.channelsAndUsers[data.roomId].messages.push(messageObject);
        }
        try {
            if (!data.isAndroid) {
                this.userService.activeUsers.forEach((userConnectInfo, username) => {
                    if (userConnectInfo.isConnectedToAndroid) {
                        usernameAndroid = username;
                    }
                });
                if (usernameAndroid === 'aucun') {
                    const latestConnectionUsername = await this.userService.readLastConnectionAndroid();

                    if (latestConnectionUsername) {
                        usernameAndroid = latestConnectionUsername.usernameAndroid;
                        channelUsers = latestConnectionUsername.channelsUserAndroid;
                        for (let i = 0; i <= channelUsers.length; i++) {
                            if (channelUsers[i] === this.channelsAndUsers[data.roomId].displayName) {
                                this.tokenService.sendNotification(data.username, data.message, this.channelsAndUsers[data.roomId].displayName);
                                break;
                            }
                        }
                    }
                } else {
                    this.userService.getUserByUsername(usernameAndroid).then(async (user) => {
                        if (user) {
                            const channelsToSend = this.getChannelsAsObjectToSend()
                                .filter((channel) => user.joinedChannels.find((joinedChannel) => joinedChannel.channelId === channel.channelId))
                                .map((channel) => channel.displayName);
                            channelUsers = channelsToSend;

                            for (let i = 0; i <= channelUsers.length; i++) {
                                if (channelUsers[i] === this.channelsAndUsers[data.roomId].displayName) {
                                    this.tokenService.sendNotification(data.username, data.message, this.channelsAndUsers[data.roomId].displayName);
                                    break;
                                }
                            }
                        }
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error: ${error}`);
        }

        this.logger.log(`${data.username}: ${data.message} (Room: ${data.roomId})`);
        this.chatPersistenceService.writeChannelsToFile();

        await this.incrementNumberOfUnreadMessagesInChannelForEverySubscribedUser(data.roomId);
        this.sendNewMessageNotification(data.roomId, messageObject);
    }

    @SubscribeMessage(ChatEvents.RequestListOfChannels)
    getListOfChannels(socket: Socket): void {
        this.sendListOfChannels(socket);
    }

    @SubscribeMessage(ChatEvents.RequestJoinChannel)
    async enterChannel(socket: Socket, data: { username: string; channelId: string }): Promise<void> {
        // The idea is not to join the socket room,
        // but to add the socket to the list of sockets in the channel (separate from the Socket.io room)

        // If the channel doesn't exist, create it
        if (!this.channelsAndUsers[data.channelId]) this.channelsAndUsers[data.channelId] = new ChatRoom(data.channelId);

        // Remove the user from every channel first
        Object.keys(this.channelsAndUsers).forEach((channel) => {
            const index = this.channelsAndUsers[channel].connectedUsers.findIndex((user) => user.socket === socket);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (index !== -1) {
                this.channelsAndUsers[channel].connectedUsers.splice(index, 1);
            }
        });

        // Add the user to the channel it wants to join if it's not already in it
        if (!this.channelsAndUsers[data.channelId].connectedUsers.some((user) => user.socket === socket)) {
            // If the user is not already in the channel, add them
            this.channelsAndUsers[data.channelId].connectedUsers.push({ socket, username: data.username });
            // Other actions to perform after user joins the channel
            this.sendHistoryOfMessages(socket, data.channelId);

            await this.resetNumberOfUnreadMessagesInChannelForUser(data.channelId, data.username);

            this.sendListOfSubscribedUsersInSpecificChannel(data.channelId);

            this.logger.log(`User ${data.username} entered channel ${data.channelId}`);
        }
    }

    @SubscribeMessage(ChatEvents.RequestExitChannel)
    exitChannel(socket: Socket, data: { username: string; channelId: string }): void {
        // Remove the user from the channel
        if (this.channelsAndUsers[data.channelId]) {
            const index = this.channelsAndUsers[data.channelId].connectedUsers.findIndex((user) => user.socket === socket);
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (index !== -1) {
                this.channelsAndUsers[data.channelId].connectedUsers.splice(index, 1);
            }
        }

        this.logger.log(`User ${data.username} left channel ${data.channelId}`);
    }

    @SubscribeMessage(ChatEvents.RequestChannelCreation)
    createChannelRequest(socket: Socket, channelName: string): void {
        if (channelName.trim() === '') return;

        // Create a new channel
        const channelId = channelName.toLowerCase().replace(' ', '-');
        if (!this.channelsAndUsers[channelId]) this.channelsAndUsers[channelId] = new ChatRoom(channelName);

        this.sendListOfChannels(socket, true);
        this.chatPersistenceService.writeChannelsToFile();
    }

    @SubscribeMessage(ChatEvents.RequestChannelDeletion)
    deleteChannel(socket: Socket, channelId: string): void {
        // First, let's get all the the connected users
        const usersInChannel = this.userService.activeUsers;

        const allSockets = this.server.sockets;

        // Remove the channel from every user
        usersInChannel?.forEach((user, key) => {
            const userSocket = allSockets.sockets.get(user.socketId);
            this.unsubscribeFromChannel(userSocket, { channelId, username: key });
            this.logger.log(`User ${key} (${user.socketId}) left channel ${channelId} with socket ${userSocket.id}`);
        });

        this.deleteChannelById(channelId);

        this.sendListOfChannels(socket, true);
    }

    @SubscribeMessage(ChatEvents.RequestChannelSubscription)
    async subscribeToChannel(socket: Socket, data: { channelId: string; username: string }): Promise<void> {
        // this.logger.log(`User ${data.username} subscribed to channel ${data.channelId}`);

        try {
            if (this.channelsAndUsers[data.channelId]) {
                await this.userService.addChannelToUser(data.username, data.channelId);
                this.getUserSubscribedChannels(socket, data.username);

                this.sendListOfSubscribedUsersInSpecificChannel(data.channelId);
            }
        } catch (error) {
            this.logger.error(`User ${data.username} cannot subscribed to channel ${data.channelId}`);
        }
    }

    @SubscribeMessage(ChatEvents.RequestChannelUnsubscription)
    async unsubscribeFromChannel(socket: Socket, data: { channelId: string; username: string }): Promise<void> {
        if (this.channelsAndUsers[data.channelId]) {
            await this.userService.removeChannelFromUser(data.username, data.channelId);
            this.getUserSubscribedChannels(socket, data.username);

            this.sendListOfSubscribedUsersInSpecificChannel(data.channelId);

            // this.logger.log(`User ${data.username} unsubscribed from channel ${data.channelId}`);
        }
    }

    @SubscribeMessage(ChatEvents.RequestUserSubscribedChannels)
    async getUserSubscribedChannels(socket: Socket, username: string): Promise<void> {
        this.userService.getUserByUsername(username).then(async (user) => {
            if (user) {
                // TODO: Change this log to a debug log or something else.
                // this.logger.log(
                //     `User ${username} joined channels: ${user.joinedChannels.reduce((acc, channel) => `${acc}, ${channel.channelId}`, '')}`,
                // );
                const channelsToSend = this.getChannelsAsObjectToSend().filter((channel) =>
                    user.joinedChannels.find((joinedChannel) => joinedChannel.channelId === channel.channelId),
                );

                // If the main channel is not in the list of channels, add it
                if (!channelsToSend.find((channel) => channel.channelId === this.mainChannel)) {
                    await this.subscribeToChannel(socket, { channelId: this.mainChannel, username });
                }

                // For each channel, set the number of unread messages
                channelsToSend.forEach((channel) => {
                    channel.numberOfUnreadMessages = user.joinedChannels.find(
                        (joinedChannel) => joinedChannel.channelId === channel.channelId,
                    )?.numberOfUnreadMessages;
                });
                socket.emit(ChatEvents.UserSubscribedChannelsSent, channelsToSend);
            }
        });
    }

    sendHistoryOfMessages(socket: Socket, roomId: string): void {
        if (this.channelsAndUsers[roomId]) {
            this.channelsAndUsers[roomId].messages.forEach((message) => {
                socket.emit(ChatEvents.MessageSent, message);
            });
        }
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

    sendListOfChannels(socket: Socket, sendToEveryone: boolean = false): void {
        if (this.channelsAndUsers[this.mainChannel] === undefined) {
            this.channelsAndUsers[this.mainChannel] = new ChatRoom('Home');
        }

        const channels = this.getChannelsAsObjectToSend();

        // Remove the private channels from the list
        const publicChannels = channels.filter((channel) => !channel.isPrivate);

        // Remove the main channel from the list
        const index = publicChannels.findIndex((channel) => channel.channelId === this.mainChannel);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (index !== -1) {
            publicChannels.splice(index, 1);
        }

        if (sendToEveryone) {
            this.server.emit(ChatEvents.ListOfChannelsSent, publicChannels);
            this.logger.log(`List of channels sent to everyone (${JSON.stringify(publicChannels)})`);
        } else {
            socket.emit(ChatEvents.ListOfChannelsSent, publicChannels);

            this.logger.log(`List of channels sent to ${socket.id} (${JSON.stringify(publicChannels)})`);
        }
    }

    async incrementNumberOfUnreadMessagesInChannelForEverySubscribedUser(channelId: string): Promise<void> {
        // Every user subscribed to the channel will have the number of unread messages incremented
        // Unless they already are in the channel

        const usersInChannel = await this.userService.getUsersSubscribedToChannel(channelId);

        const channelData: ChatRoom = this.channelsAndUsers[channelId];

        this.logger.log(`Users in channel ${channelId}: ${usersInChannel.map((user) => user.username).toString()}`);

        for (const user of usersInChannel) {
            if (channelData && channelData?.connectedUsers) {
                if (!channelData.connectedUsers.find((connectedUser) => connectedUser.username === user.username)) {
                    await this.userService.incrementNumberOfUnreadMessages(user.username, channelId);
                }
            }
        }

        channelData.connectedUsers.forEach(async (channelUser) => {
            await this.getUserSubscribedChannels(channelUser.socket, channelUser.username);
        });
    }

    async resetNumberOfUnreadMessagesInChannelForUser(channelId: string, username: string): Promise<void> {
        await this.userService.resetNumberOfUnreadMessages(username, channelId);
    }

    sendNewMessageNotification(roomId: string, message: Message): void {
        this.server.emit(ChatEvents.NotifyMessageSentInChannel, { roomId, message });
        this.logger.log(`New message notification sent to ${roomId} (${message.message})`);
    }

    async sendListOfSubscribedUsersInSpecificChannel(roomId: string): Promise<void> {
        if (this.channelsAndUsers[roomId]) {
            const subscribedUsers = await this.userService.getUsersSubscribedToChannel(roomId);

            this.channelsAndUsers[roomId].connectedUsers.forEach((channelUser) => {
                channelUser.socket.emit(ChatEvents.ListOfUsersInSpecificChannelSent, { roomId, subscribedUsers });
            });
        }
    }

    newBestTimeScore(message: string): void {
        this.server.emit(ChatEvents.MessageSent, { message, username: 'Événement' });
        this.logger.log(`Événement: ${message}`);
    }

    createPrivateChannel(channelId: string, channelName: string): void {
        if (channelName.trim() === '') return;

        // Create a new channel
        if (!this.channelsAndUsers[channelId]) this.channelsAndUsers[channelId] = new ChatRoom(channelName, true);

        this.chatPersistenceService.writeChannelsToFile();
    }

    async unsubscribeFromAllPrivateChannels(socket: Socket, username: string): Promise<void> {
        const keys = Object.keys(this.channelsAndUsers);

        for (const channel of keys) {
            if (this.channelsAndUsers[channel] && this.channelsAndUsers[channel].isPrivate) {
                await this.unsubscribeFromChannel(socket, { channelId: channel, username });
            }
        }

        this.logger.log(`User ${username} left all private channels`);
    }

    deleteChannelById(channelId: string): void {
        // Delete the channel and remove all users from it
        if (this.channelsAndUsers[channelId]) {
            const connectedUsers = this.channelsAndUsers[channelId].connectedUsers;
            // Remove users from the channel
            connectedUsers.forEach((user) => {
                const index = connectedUsers.indexOf(user);
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                if (index !== -1) {
                    connectedUsers.splice(index, 1);
                }
            });
            // Delete the channel
            delete this.channelsAndUsers[channelId];
        }

        this.logger.log(`Channel ${channelId} deleted`);

        this.chatPersistenceService.writeChannelsToFile();
    }
}
