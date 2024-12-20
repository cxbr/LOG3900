import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChatModalComponent } from '@app/components/chat-modal/chat-modal.component';
import { GlobalChatService } from '@app/services/global-chat/global-chat.service';

@Component({
    selector: 'app-chat-button',
    templateUrl: './chat-button.component.html',
    styleUrls: ['./chat-button.component.scss'],
})
export class ChatButtonComponent {
    static openChatModal: MatDialogRef<ChatModalComponent> | null = null;

    isThisChatModalOpen: boolean = false;
    constructor(private dialog: MatDialog, private globalChatService: GlobalChatService) {}

    static forceCloseOpenChatModal() {
        if (ChatButtonComponent.openChatModal) {
            ChatButtonComponent.openChatModal.close();
            ChatButtonComponent.openChatModal = null;
        }
    }

    getNumberOfUnreadMessages() {
        return this.globalChatService.userSubscribedChannels.reduce((acc, channel) => acc + channel.numberOfUnreadMessages, 0);
    }

    getNotifText() {
        const unreadMessages = this.getNumberOfUnreadMessages();
        return unreadMessages > 0 ? ` (${unreadMessages})` : '';
    }

    getIconClass() {
        return this.getNumberOfUnreadMessages() > 0 ? 'chat alert-notification' : 'chat';
    }

    showChatModal() {
        // If the chat modal is already open, close it
        if (ChatButtonComponent.openChatModal) {
            ChatButtonComponent.forceCloseOpenChatModal();
            return;
        }

        // Only open the modal if it is not already open
        if (!this.isThisChatModalOpen) {
            const dialogRef: MatDialogRef<ChatModalComponent> = this.dialog.open(ChatModalComponent, {
                panelClass: 'custom-dialog-container',
                position: {
                    left: '0',
                    top: '11%',
                },
                hasBackdrop: false,
                disableClose: true,
            });
            this.isThisChatModalOpen = true;
            dialogRef.afterClosed().subscribe(() => {
                this.isThisChatModalOpen = false;

                if (ChatButtonComponent.openChatModal === dialogRef) {
                    ChatButtonComponent.openChatModal = null;
                }
            });

            ChatButtonComponent.openChatModal = dialogRef;
        }
    }
}
