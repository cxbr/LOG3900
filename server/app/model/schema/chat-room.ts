/* eslint-disable max-len */
import { Message } from '@common/classes/chat-message';
import { Socket } from 'socket.io';

export class ChatRoom {
    connectedUsers: { socket: Socket; username: ''; isConnectedToAndroid: false }[] = []; // This is used to keep track of which sockets are in this channel live

    messages: Message[] = [];
    displayName: string;
    isPrivate: boolean = false;

    constructor(displayName: string, isPrivate: boolean = false) {
        this.displayName = displayName;
        this.isPrivate = isPrivate;
    }
}
