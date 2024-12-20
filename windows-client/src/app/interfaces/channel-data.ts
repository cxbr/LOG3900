export class ChannelData {
    channelId: string;
    displayName: string;
    numberOfUnreadMessages: number = 0;
    isPrivate: boolean = false;

    constructor(channelId: string, displayName: string) {
        this.channelId = channelId;
        this.displayName = displayName;
    }
}
