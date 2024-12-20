import { ChatRoom } from '@app/model/schema/chat-room';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class ChatService {
    private internalChannels: Map<string, ChatRoom> = new Map<string, ChatRoom>();

    constructor() {
        this.readChannelsFromFile();
    }

    get channels(): Map<string, ChatRoom> {
        return this.internalChannels;
    }

    set channels(value: Map<string, ChatRoom>) {
        this.internalChannels = value;
    }

    writeChannelsToFile(): void {
        // Write the channels to a file
        const jsonValue = this.serializeChannelsToJSON();

        // Write the JSON to a file
        const dirName = './assets/chats/';

        if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
        fs.writeFile(`${dirName}channels.json`, jsonValue, () => {
            return; // folder already exists
        });
    }

    updateUsernameInOldMessages(oldUsername: string, newUsername: string): void {
        for (const [, value] of Object.entries(this.internalChannels)) {
            const channelData: ChatRoom = value;
            channelData.messages.forEach((message) => {
                if (message.username === oldUsername) message.username = newUsername;
            });
        }
    }

    private serializeChannelsToJSON(): string {
        const serializedData = JSON.stringify(
            this.internalChannels,
            (key, value: ChatRoom) => {
                if (key === 'connectedUsers') return [];
                return value;
            },
            2,
        );

        return serializedData;
    }

    private deserializeChannelsFromJSON(jsonValue: string): void {
        this.channels = JSON.parse(jsonValue);
    }

    private readChannelsFromFile(): void {
        const dirName = './assets/chats/';
        if (!fs.existsSync(dirName)) return;

        if (!fs.existsSync(`${dirName}channels.json`)) return;
        const data = fs.readFileSync(`${dirName}channels.json`, 'utf8');
        this.deserializeChannelsFromJSON(data);
    }
}
