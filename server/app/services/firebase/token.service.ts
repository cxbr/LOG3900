/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
@Injectable()
export class TokenService {
    dirName = './assets/token';
    constructor(private readonly logger: Logger) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    saveTokenInFile(token: string): void {
        const filePath = `${this.dirName}/token-firebase.json`;
        if (!fs.existsSync(this.dirName + '/')) fs.mkdirSync(this.dirName);

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
                try {
                    if (data === token) {
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing existing token:', error);
                }
            }

            fs.writeFile(filePath, this.serializeRatingToJSON(token), () => {
                return;
            });
        });
    }
    async sendNotification(titleNotif: string, bodyNotif: string, channelName: string) {
        const filePath = `${this.dirName}/token-firebase.json`;
        try {
            let tokenNotif = fs.readFileSync(filePath, 'utf8').trim();
            tokenNotif = tokenNotif.replace(/^"|"$/g, '');
            this.logger.log(`Token retrieved succesfully ${tokenNotif}`);

            if (!tokenNotif) {
                console.error('Token not found or empty.');
                return;
            }

            const message = {
                token: tokenNotif,
                notification: {
                    title: channelName,
                    body: titleNotif + ': ' + bodyNotif,
                },
            };

            await admin.messaging().send(message);
            this.logger.log('New message notification sent to Android');
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
    private serializeRatingToJSON(token: string): string {
        const serializedData = JSON.stringify(token, null, 2);
        return serializedData;
    }
}
