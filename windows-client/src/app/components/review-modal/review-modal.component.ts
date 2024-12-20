import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game/game.service';
import { UserHttpService } from '@app/services/user-http/user-http.service';
import { RatingFormat } from '@common/classes/rating-format';

@Component({
    selector: 'app-review-modal',
    templateUrl: './review-modal.component.html',
    styleUrls: ['./review-modal.component.scss'],
})
export class ReviewModalComponent {
    userRating: number = 0;

    constructor(public gameService: GameService, private userHttpService: UserHttpService, private router: Router) {}

    sendRatingToServer(): void {
        const rating: RatingFormat = {
            rating: this.userRating,
            gameName: this.gameService.gameRoom.userGame.gameName,
        };
        this.userHttpService.saveReview(rating).subscribe();
    }
    navigateToHome(): void {
        this.router.navigate(['/home']);
    }
    onRatingChange(rating: number): void {
        this.userRating = rating;
    }
}
