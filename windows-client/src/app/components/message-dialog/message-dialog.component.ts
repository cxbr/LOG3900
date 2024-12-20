import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-message-dialog',
    templateUrl: './message-dialog.component.html',
    styleUrls: ['./message-dialog.component.scss'],
})
export class MessageDialogComponent implements OnInit {
    message: string;
    constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}

    ngOnInit(): void {
        this.message = this.data.message;
    }
}
