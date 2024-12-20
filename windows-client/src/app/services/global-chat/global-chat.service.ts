import { Injectable } from '@angular/core';
import { ChannelData } from '@app/interfaces/channel-data';
import { User } from '@app/interfaces/user';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { UserService } from '@app/services/user/user.service';
import { Message } from '@common/classes/chat-message';
import { ChatEvents } from '@common/enums/chat.gateway.variables';

@Injectable({
    providedIn: 'root',
})
export class GlobalChatService {
    userSubscribedChannels: ChannelData[] = [];
    currentChannel: ChannelData | null = null;

    constructor(private readonly socketService: CommunicationSocketService, private readonly userService: UserService) {
        this.listenToMessageNotifications((data) => {
            if (!userService.loggedInUser) return;

            this.showNotificationIfNotInChannel(data);
            this.playSoundIfMessageIsFromASubscribedChannel(data);
        });

        this.listenToUserSubscribedChannelsChanges((channels) => {
            this.refreshGlobalUserSubscribedChannels(channels);
        });
    }

    onLogin() {
        // When we log in, we want to get the list of user subscribed channels
        // This allows us to receive notifications for messages in channels we are subscribed to

        this.getSubscribedChannels().then((channels) => {
            this.refreshGlobalUserSubscribedChannels(channels);
        });

        this.currentChannel = null;
    }

    async getAvailableChannels(): Promise<ChannelData[]> {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();

        this.socketService.send(ChatEvents.RequestListOfChannels);
        return new Promise((resolve) => {
            this.socketService.on(ChatEvents.ListOfChannelsSent, (channels: ChannelData[]) => {
                resolve(channels);
            });
        });
    }

    async getSubscribedChannels(): Promise<ChannelData[]> {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();

        this.socketService.send(ChatEvents.RequestUserSubscribedChannels, this.getUserNickname());
        return new Promise((resolve) => {
            this.socketService.on(ChatEvents.UserSubscribedChannelsSent, (channels: ChannelData[]) => {
                resolve(channels);
            });
        });
    }

    refreshGlobalUserSubscribedChannels(channels: ChannelData[]): void {
        this.userSubscribedChannels = channels;
    }

    listenToChannelChanges(callback: (channels: ChannelData[]) => void): void {
        this.socketService.on(ChatEvents.ListOfChannelsSent, callback);
    }

    listenToUserSubscribedChannelsChanges(callback: (channels: ChannelData[]) => void): void {
        this.socketService.on(ChatEvents.UserSubscribedChannelsSent, callback);
    }

    listenToMessageNotifications(callback: (data: { roomId: string; message: Message }) => void): void {
        this.socketService.on(ChatEvents.NotifyMessageSentInChannel, callback);
    }

    listenToListOfSubscribedUsersInSpecificChannel(callback: (data: { roomId: string; subscribedUsers: User[] }) => void): void {
        this.socketService.on(ChatEvents.ListOfUsersInSpecificChannelSent, callback);
    }

    async joinChannel(channel: ChannelData): Promise<void> {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();

        this.socketService.send(ChatEvents.RequestJoinChannel, { channelId: channel.channelId, username: this.getUserNickname() });
        this.currentChannel = channel;
    }

    async leaveChannel(channel: ChannelData): Promise<void> {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();

        this.socketService.send(ChatEvents.RequestExitChannel, { channelId: channel.channelId, username: this.getUserNickname() });
        this.currentChannel = null;
    }

    async subscribeToChannel(channel: ChannelData): Promise<void> {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();

        this.socketService.send(ChatEvents.RequestChannelSubscription, { channelId: channel.channelId, username: this.getUserNickname() });
    }

    async unsubscribeFromChannel(channel: ChannelData): Promise<void> {
        if (!this.socketService.isSocketAlive()) this.socketService.connect();

        this.socketService.send(ChatEvents.RequestChannelUnsubscription, { channelId: channel.channelId, username: this.getUserNickname() });
    }

    requestChannelCreation(channelName: string): void {
        this.socketService.send(ChatEvents.RequestChannelCreation, channelName);
    }

    requestChannelDeletion(channelId: string): void {
        this.socketService.send(ChatEvents.RequestChannelDeletion, channelId);
    }

    getUserNickname(): string {
        return this.userService.loggedInUser?.username || 'anon';
    }

    showNotificationIfNotInChannel(data: { roomId: string; message: Message }): void {
        const channelIds = this.userSubscribedChannels.map((channel) => channel.channelId);
        if (!channelIds.includes(data.roomId)) return;

        if (this.currentChannel != null && this.currentChannel.channelId === data.roomId) return;

        const channelName = this.userSubscribedChannels.find((channel) => channel.channelId === data.roomId)?.displayName;
        // alert(`Message in ${data.roomId}: \n ${data.message.username}: ${data.message.message}`);
        this.showNotification(`Nouveau message dans ${channelName}`, `${data.message.username}: ${data.message.message}`);

        this.getSubscribedChannels().then((channels) => {
            this.refreshGlobalUserSubscribedChannels(channels);
        });
    }

    playSoundIfMessageIsFromASubscribedChannel(data: { roomId: string; message: Message }): void {
        const channelIds = this.userSubscribedChannels.map((channel) => channel.channelId);
        if (!channelIds.includes(data.roomId)) return;

        if (data.message.username === this.getUserNickname()) return;

        const audio = new Audio('assets/sounds/chat_notification.mp3');
        audio.play();
    }

    showNotification(title: string, body: string) {
        const options = {
            body,
            icon: 'assets/pictures/logo.png',
        };

        new Notification(title, options);
    }
}
