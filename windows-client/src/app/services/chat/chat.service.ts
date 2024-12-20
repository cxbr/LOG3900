import { Injectable } from '@angular/core';
import { CommunicationSocketService } from '@app/services/communication-socket/communication-socket.service';
import { Message } from '@common/classes/chat-message';
import { ChatEvents } from '@common/enums/chat.gateway.variables';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    message$ = new Subject<Message>();
    private isTyping = false;

    private messagesHandled = false;

    constructor(private readonly socketService: CommunicationSocketService) {}

    handleMessage(): void {
        if (this.messagesHandled) return;

        this.socketService.on(ChatEvents.MessageSent, (message: Message) => {
            this.message$.next(message);
        });

        this.messagesHandled = true;
    }

    stopHandleMessage(): void {
        this.socketService.off(ChatEvents.MessageSent);
        this.messagesHandled = false;
    }

    sendMessage(message: string, username: string, roomId: string): void {
        this.socketService.send(ChatEvents.RequestSendMessage, { message, username, roomId, isAndroid: false });
    }

    setIsTyping(value: boolean): void {
        this.isTyping = value;
    }

    getIsTyping(): boolean {
        return this.isTyping;
    }
}
