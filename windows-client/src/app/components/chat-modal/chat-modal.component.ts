import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { InputDialogComponent } from '@app/components/input-dialog/input-dialog.component';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { ChannelData } from '@app/interfaces/channel-data';
import { User } from '@app/interfaces/user';
import { ChatService } from '@app/services/chat/chat.service';
import { GlobalChatService } from '@app/services/global-chat/global-chat.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';

@Component({
    selector: 'app-chat-modal',
    templateUrl: './chat-modal.component.html',
    styleUrls: ['./chat-modal.component.scss'],
})
export class ChatModalComponent implements OnInit, OnDestroy {
    currentChannel: ChannelData | undefined = undefined;

    availableChannels: ChannelData[] = [];
    subscribedUsersInCurrentChannel: User[] = [];

    showChannelSelector = false; // Needs to be hidden for the prototype

    // Enum to define which view is being shown
    currentView: ChatView = ChatView.SubscribedChannels;

    channelUsedByChatComponent: ChannelData = new ChannelData('', 'Loading...');
    searchText: string = '';

    // eslint-disable-next-line max-params
    constructor(
        private dialogRef: MatDialogRef<ChatModalComponent>,
        private dialogOpener: MatDialog,
        private globalChatService: GlobalChatService,
        private chatService: ChatService,
        private verifyInputService: VerifyInputService,
    ) {}

    get username() {
        return this.globalChatService.getUserNickname();
    }

    get headerTitle() {
        switch (this.currentView) {
            case ChatView.AllChannelsView:
                return 'Canaux à joindre';
            case ChatView.Chat:
                return this.channelUsedByChatComponent.displayName;
            case ChatView.SubscribedChannels:
                return 'Vos canaux';
            case ChatView.CurrentChannelInfo:
                return `Infos de ${this.currentChannel?.displayName}`;
        }

        return 'anons chat';
    }

    get subscribedChannels(): ChannelData[] {
        return this.globalChatService.userSubscribedChannels;
    }

    ngOnInit() {
        this.initializeChannels();
        this.chatService.handleMessage();
    }

    closeModal() {
        this.dialogRef.close();
        this.currentView = ChatView.SubscribedChannels;
    }

    onSelectChannelFromHTML(event: Event) {
        const selectedChannelId = (event.target as HTMLSelectElement).value;
        const selectedChannel = this.availableChannels.find((channel) => channel.channelId === selectedChannelId);

        if (selectedChannel) {
            this.enterChannel(selectedChannel);
        }
    }

    async changeView(newView: ChatView) {
        this.currentView = newView;

        if (newView !== ChatView.Chat) {
            if (this.currentChannel) {
                this.globalChatService.leaveChannel(this.currentChannel);
            }
        }

        if (newView === ChatView.AllChannelsView) {
            this.currentChannel = undefined;
            const receivedChannels = await this.globalChatService.getAvailableChannels();
            this.updateListOfAllChannels(receivedChannels);
        }

        if (newView === ChatView.SubscribedChannels) {
            this.currentChannel = undefined;
        }

        if (newView === ChatView.AllChannelsView || newView === ChatView.SubscribedChannels) {
            this.globalChatService.currentChannel = null;
        }

        const receivedSubscribedChannels = await this.globalChatService.getSubscribedChannels();
        this.updateSubscribedChannels(receivedSubscribedChannels);
    }

    // Called when the user returns to the chat from the info view in HTML
    onReturnToChatFromInfoButton() {
        if (this.currentChannel) this.enterChannel(this.currentChannel);
    }

    enterChannel(channel: ChannelData) {
        this.currentChannel = channel;

        // This workaround is used to maintain the same reference used by the chat-box component
        this.channelUsedByChatComponent.channelId = channel.channelId;
        this.channelUsedByChatComponent.displayName = channel.displayName;

        this.globalChatService.joinChannel(channel);

        this.changeView(ChatView.Chat);
    }

    subscribeToChannel(channel: ChannelData) {
        this.globalChatService.subscribeToChannel(channel);

        this.changeView(ChatView.SubscribedChannels);
    }

    unsubscribeFromChannel(channel: ChannelData) {
        this.globalChatService.unsubscribeFromChannel(channel);

        this.changeView(ChatView.SubscribedChannels);
    }

    showChannelCreationModal() {
        // Display a modal with a text input to create a new channel

        this.dialogOpener
            .open(InputDialogComponent, {
                data: { title: 'Nom du nouveau canal' },
                panelClass: 'custom-modal',
            })
            .afterClosed()
            .subscribe((result: string) => {
                if (result === undefined) {
                    return;
                }

                const isNameValid = this.verifyInputService.verify(result);

                // Check if the channel name is valid
                if (!isNameValid) {
                    this.dialogOpener.open(MessageDialogComponent, {
                        panelClass: 'custom-modal',
                        data: { message: 'Le nom du canal est trop vulgaire' },
                    });

                    return;
                }

                // Handle the result here
                this.globalChatService.requestChannelCreation(result);
            });
    }

    deleteChannel(channel: ChannelData) {
        this.globalChatService.requestChannelDeletion(channel.channelId);
    }

    ngOnDestroy() {
        this.chatService.stopHandleMessage();

        if (this.currentChannel) {
            this.globalChatService.leaveChannel(this.currentChannel);
        }

        this.globalChatService.getSubscribedChannels().then((channels) => {
            this.globalChatService.refreshGlobalUserSubscribedChannels(channels);
        });

        this.globalChatService.currentChannel = null;
        this.currentView = ChatView.SubscribedChannels;
        this.currentChannel = undefined;
    }

    updateListOfAllChannels(channels: ChannelData[]) {
        this.availableChannels = channels;

        // If the selected channel is no longer in the list, then leave it
        if (
            this.currentChannel &&
            this.currentView === ChatView.Chat &&
            !this.availableChannels.find((channel) => channel.channelId === this.currentChannel?.channelId)
        ) {
            this.currentChannel = undefined;
            this.changeView(ChatView.AllChannelsView);

            this.dialogOpener.open(MessageDialogComponent, {
                panelClass: 'custom-modal',
                data: { message: 'Le channel dans lequel vous étiez a été supprimé' },
            });
        }

        // If there is a home channel in the list, put it on top
        const homeChannelIndex = this.availableChannels.findIndex((channel) => channel.channelId === 'home');
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (homeChannelIndex !== -1) {
            const homeChannel = this.availableChannels.splice(homeChannelIndex, 1)[0];
            this.availableChannels.unshift(homeChannel);
        }
    }

    updateSubscribedChannels(channels: ChannelData[]) {
        this.globalChatService.refreshGlobalUserSubscribedChannels(channels);
    }

    updateUsersInCurrentChannel(data: { roomId: string; subscribedUsers: User[] }) {
        if (this.currentChannel?.channelId === data.roomId) {
            this.subscribedUsersInCurrentChannel = data.subscribedUsers;
        }
    }

    getChannelsAfterFiltering(channelsToFilter: ChannelData[], filter: string) {
        if (filter === '') {
            return channelsToFilter;
        }

        return channelsToFilter.filter((channel) => channel.displayName.toLowerCase().includes(filter.toLowerCase()));
    }

    private async initializeChannels() {
        const receivedChannels = await this.globalChatService.getAvailableChannels();
        const receivedSubscribedChannels = await this.globalChatService.getSubscribedChannels();

        this.updateListOfAllChannels(receivedChannels);
        this.updateSubscribedChannels(receivedSubscribedChannels);

        this.globalChatService.listenToChannelChanges((channels) => {
            this.updateListOfAllChannels(channels);
        });

        this.globalChatService.listenToUserSubscribedChannelsChanges((channels) => {
            this.updateSubscribedChannels(channels);
        });

        this.globalChatService.listenToListOfSubscribedUsersInSpecificChannel((data) => {
            this.updateUsersInCurrentChannel(data);
        });
    }
}

// TODO: Move this to a separate file
export enum ChatView {
    AllChannelsView, // 0
    Chat, // 1
    SubscribedChannels, // 2
    CurrentChannelInfo, // 3
}
