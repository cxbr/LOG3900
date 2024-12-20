/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-star-rating',
    templateUrl: './star-rating.component.html',
    styleUrls: ['./star-rating.component.scss'],
})
export class StarRatingComponent {
    @Input() rating: number;
    @Output() ratingChange: EventEmitter<number> = new EventEmitter<number>();

    stars: number[] = [1, 2, 3, 4, 5];

    onClick(star: number): void {
        if (this.rating === star) {
            this.rating = star - 1;
        } else {
            this.rating = star;
        }
        this.ratingChange.emit(this.rating);
    }
}
