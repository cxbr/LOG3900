import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogComponent } from '@app/components/message-dialog/message-dialog.component';
import { Constants } from 'src/assets/variables/constants';

@Injectable({
    providedIn: 'root',
})
export class VerifyInputService {
    constructor(public dialog: MatDialog) {}

    verify(input: string | undefined): boolean {
        if (!input) return false;

        if (/[\u200B-\u200D\uFEFF]/.test(input)) {
            return false;
        }

        if (input.trim().length === 0) {
            return false;
        }

        const forbiddenWords = [
            'fuck',
            'tabarnak',
            'shit',
            'merde',
            'criss',
            'calisse',
            'caliss',
            'esti',
            'osti',
            'putain',
            'marde',
            'nique',
            'ta gueule',
            'vas te faire foutre',
            'connard',
            'trou de cul',
            'enfoiré',
            '‎ ', // Can't have the invisible character
            'baise',
            'league of legends',
            'pute',
        ];
        for (const word of forbiddenWords) {
            if (input.toLowerCase().includes(word.toLowerCase())) {
                this.dialog.open(MessageDialogComponent, {
                    data: { message: 'Message incorrect' },
                    panelClass: 'custom-modal',
                });

                return false;
            }
        }
        return true;
    }

    verifyNotNumber(input: string): boolean {
        if (!/^\d+$/.test(input)) {
            return true;
        }
        return false;
    }

    verifyConstantsInBounds(input: number | undefined, type: string): boolean {
        if (!input) return false;

        switch (type) {
            case 'gameDuration':
                return input >= Constants.MingameDuration && input <= Constants.MaxgameDuration;
            case 'penaltyTime':
                return input >= Constants.MinPenaltyTime && input <= Constants.MaxPenaltyTime;
            case 'bonusTime':
                return input >= Constants.MinBonusTime && input <= Constants.MaxBonusTime;
            default:
                return false;
        }
    }
}
