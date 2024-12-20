import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
    selector: 'app-avatar-image',
    templateUrl: './avatar-image.component.html',
    styleUrls: ['./avatar-image.component.scss'],
})
export class AvatarImageComponent implements AfterViewInit {
    @ViewChild('image') image: ElementRef<HTMLImageElement>;
    @ViewChild('avatarContainer') container: ElementRef<HTMLImageElement>;

    @Input() avatar: string;
    @Input() diameter: string = '20vh';

    ngAfterViewInit(): void {
        this.setAvatarDimensions();
        this.setAvatarDiameter();
    }

    private setAvatarDimensions(): void {
        this.image.nativeElement.onload = () => {
            if (this.image.nativeElement.width <= this.image.nativeElement.height) {
                this.image.nativeElement.classList.add('full-width');
                this.image.nativeElement.classList.remove('full-height');
            } else if (this.image.nativeElement.width > this.image.nativeElement.height) {
                this.image.nativeElement.classList.add('full-height');
                this.image.nativeElement.classList.remove('full-width');
            }
        };
    }

    private setAvatarDiameter(): void {
        this.container.nativeElement.style.width = this.diameter;
        this.container.nativeElement.style.height = this.diameter;
    }
}
