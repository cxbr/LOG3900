import { Component, HostListener } from '@angular/core';
import { ThemeService } from '@app/services/theme/theme.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    // Theme service constructor called to set theme
    constructor(readonly _: ThemeService) {}

    @HostListener('window:unload', ['$event'])
    unloadHandler() {
        // Use cleanup fonctions in here
    }
}
