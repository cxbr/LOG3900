import { GameRating } from '@common/classes/game-rating';
import { RatingFormat } from '@common/classes/rating-format';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class RatingService {
    dirName = './assets/rating';
    constructor(private readonly logger: Logger) {}

    saveReviewInFile(ratingData: RatingFormat): void {
        const filePath = `${this.dirName}/review-${ratingData.gameName}.json`;
        const serializedData = this.serializeRatingToJSON({ rating: 0, numberOfRating: 0 });
        if (!fs.existsSync(this.dirName + '/')) fs.mkdirSync(this.dirName);
        if (!fs.existsSync(filePath))
            fs.writeFile(filePath, serializedData, () => {
                return;
            });

        fs.readFile(filePath, 'utf8', (err, data) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let reviews: any;

            if (!err) {
                try {
                    reviews = JSON.parse(data);
                } catch (error) {
                    this.logger.error('Error parsing existing reviews:', error);
                }
            }
            if (!reviews) {
                this.logger.log('File was deleted');
                return;
            }
            reviews.rating = (ratingData.rating + reviews.rating * reviews.numberOfRating) / (reviews.numberOfRating + 1);
            reviews.numberOfRating = reviews.numberOfRating + 1;

            fs.writeFile(filePath, this.serializeRatingToJSON(reviews), () => {
                return;
            });
        });
    }
    getAverageReview(gameName: string): GameRating {
        const filePath = `${this.dirName}/review-${gameName}.json`;
        const rating: GameRating = {
            numberOfRating: 0,
            rating: 0.0,
        };

        try {
            if (!fs.existsSync(filePath)) {
                this.logger.error('File does not exist:', filePath);
                return rating;
            }
            const data = fs.readFileSync(filePath, 'utf8');
            const dataObj = JSON.parse(data);
            rating.numberOfRating = dataObj.numberOfRating;
            rating.rating = dataObj.rating;
        } catch (error) {
            this.logger.error('Error reading or parsing reviews:', error);
        }

        return rating;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private serializeRatingToJSON(ratingData: any): string {
        const serializedData = JSON.stringify(ratingData, null, 2);
        return serializedData;
    }
}
