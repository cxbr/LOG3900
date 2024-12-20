import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private storageKey: string = 'dark-theme';
    private isDarkMode: boolean;

    constructor() {
        const storageItem: string | null = localStorage.getItem(this.storageKey);
        this.isDarkMode = storageItem ? JSON.parse(storageItem) : false;
        this.setIsDarkMode(this.isDarkMode);
    }

    getIsDarkMode() {
        return this.isDarkMode;
    }

    setIsDarkMode(isDarkMode: boolean) {
        this.isDarkMode = isDarkMode;
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        localStorage.setItem(this.storageKey, JSON.stringify(this.isDarkMode));
    }
}
