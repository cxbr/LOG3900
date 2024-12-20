import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { IpcRenderer } from 'electron';

@Injectable({
    providedIn: 'root',
})
export class CameraService {
    private stream: MediaStream | null = null;
    private ipc: IpcRenderer | undefined;

    constructor(public dialog: MatDialog) {
        if (window && window.ipcRenderer) {
            this.ipc = window.ipcRenderer;
        } else {
            // eslint-disable-next-line no-console
            console.warn('ipcRenderer is not available');
        }
    }

    async accessCamera(): Promise<MediaStream> {
        if (!this.stream) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result = await this.ipc?.invoke('request-camera-access');
                if (result) {
                    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } else {
                    this.dialog.open(MessageDialogComponent, {
                        panelClass: 'custom-modal',
                        data: { message: "L'accès à la caméra a été refusé." },
                    });
                }
            } catch (error) {
                this.dialog.open(MessageDialogComponent, {
                    panelClass: 'custom-modal',
                    data: { message: 'Erreur : Assurez-vous que votre appareil possède une caméra disponible.' },
                });
                // eslint-disable-next-line no-console
                console.error('Error accessing camera:', error);
                throw error;
            }
        }
        return this.stream as MediaStream;
    }

    stopCamera(): void {
        if (this.stream && this.stream.getVideoTracks().length > 0) {
            this.stream.getVideoTracks().forEach((track) => track.stop());
            this.stream = null;
        }
    }
}
