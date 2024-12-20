import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChannelData } from '@app/interfaces/channel-data';

@Component({
    selector: 'app-channel-selection-item',
    templateUrl: './channel-selection-item.component.html',
    styleUrls: ['./channel-selection-item.component.scss'],
})
export class ChannelSelectionItemComponent {
    @Input() channel: ChannelData;
    @Input() closeButtonType: string = CloseButtonType.Delete;
    @Output() notifyClick: EventEmitter<ChannelData> = new EventEmitter();
    @Output() notifyDelete: EventEmitter<ChannelData> = new EventEmitter();

    deleteChannel(event: Event) {
        this.notifyDelete.emit(this.channel);
        event.stopPropagation();
    }

    selectChannel() {
        this.notifyClick.emit(this.channel);
    }

    getChannelName() {
        return `${this.channel.displayName}` + (this.channel.numberOfUnreadMessages > 0 ? ` (${this.channel.numberOfUnreadMessages})` : '');
    }

    shouldCloseButtonBeVisible() {
        if (this.channel.channelId === 'home') return false;
        if (this.channel.isPrivate) return false;

        return this.closeButtonType !== CloseButtonType.None;
    }

    getCloseButtonIcon() {
        switch (this.closeButtonType) {
            case CloseButtonType.Delete:
                return 'delete';
            case CloseButtonType.Leave:
                return 'logout';
            case CloseButtonType.None:
                return '';
        }

        return '';
    }
}

export enum CloseButtonType {
    Delete = 'delete',
    Leave = 'leave',
    None = 'none',
}
