import { IpcRenderer } from 'electron';

declare global {
    // eslint-disable-next-line no-unused-vars
    interface Window {
        ipcRenderer: IpcRenderer;
    }
}
