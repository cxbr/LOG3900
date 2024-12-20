import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AvatarService {
    private isLocalFile: boolean = false;
    private avatar: string = '';
    // private storageKey: string = 'avatar';

    // constructor() {
    //     // this.avatar = localStorage.getItem(this.storageKey) as string;
    // }

    setNetworkAvatar(avatarPath: string): void {
        this.avatar = avatarPath;
        this.isLocalFile = false;
        // localStorage.setItem(this.storageKey, avatarPath);
    }

    setLocalAvatar(avatarPath: string): void {
        this.avatar = avatarPath;
        this.isLocalFile = true;
        // localStorage.setItem(this.storageKey, avatarPath);
    }

    getAvatar(): string {
        return this.avatar;
    }

    getIsLocalFile(): boolean {
        return this.isLocalFile;
    }

    resetAvatar(): void {
        this.avatar = '';
        // localStorage.removeItem(this.storageKey);
    }
}
