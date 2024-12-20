import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ChannelData } from '@app/interfaces/channel-data';
import { ChatService } from '@app/services/chat/chat.service';
import { VerifyInputService } from '@app/services/verify-input/verify-input.service';
import { Message } from '@common/classes/chat-message';

@Component({
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent implements OnInit, AfterViewInit {
    @ViewChild('chatbox', { static: true }) chatbox: ElementRef;
    @Input() channel: ChannelData;
    @Input() username: string;
    @Input() restartSignal: boolean = false;
    @Input() timer?: number;
    @Input() isReplay = false;
    @Output() sendChatMessage = new EventEmitter<Message>();

    @ViewChild('inputElement') inputElement: ElementRef;

    applyBorder = false;
    message = '';
    messages: Message[] = [];

    constructor(private chatService: ChatService, private verifyService: VerifyInputService) {}

    static convertTimeToDate(time: number | undefined): string {
        if (!time) {
            return '';
        }
        const date = new Date(time);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
            return "Aujourd'hui " + date.toLocaleTimeString('en-GB');
        }
        if (date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate()) {
            return 'Hier ' + date.toLocaleTimeString('en-GB');
        }
        const dateFormatter = new Intl.DateTimeFormat('en-GB');
        const formattedDate = dateFormatter.format(date).split('/').reverse().join('/');
        return formattedDate + ' ' + date.toLocaleTimeString('en-GB');
    }

    ngOnInit() {
        this.chatService.handleMessage();
        this.chatService.message$.subscribe((message: Message) => {
            this.messages.push(message);
            this.sendChatMessage.emit({ username: message.username, message: message.message, time: message.time, isAndroid: message.isAndroid });
            setTimeout(() => {
                this.chatbox.nativeElement.scrollTop = this.chatbox.nativeElement.scrollHeight;
            }, 0);
            message.convertedTime = ChatBoxComponent.convertTimeToDate(message.time);
        });
    }

    ngAfterViewInit(): void {
        // Focus on the input element when the chat box is loaded
        if (this.inputElement && this.inputElement.nativeElement) {
            this.inputElement.nativeElement.focus();
        }
    }

    sendMessage(event: Event) {
        event.preventDefault();

        if (!this.verifyService.verify(this.message)) {
            this.applyBorder = true;
        } else {
            this.chatService.sendMessage(this.message, this.username, this.channel.channelId);
            this.message = '';
            this.applyBorder = false;
        }

        if (this.inputElement && this.inputElement.nativeElement) {
            this.inputElement.nativeElement.focus();
        }
    }

    chatInputFocus() {
        this.chatService.setIsTyping(true);
    }

    chatInputBlur() {
        this.chatService.setIsTyping(false);
    }

    scrollToBottom(): void {
        setTimeout(() => {
            this.chatbox.nativeElement.scrollTop = this.chatbox.nativeElement.scrollHeight;
        }, 0);
    }
}
