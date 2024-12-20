import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-input-modal-dialog',
    template: `<h2>{{ data.title }}</h2>
        <form (submit)="onFormSubmit($event)">
            <input #input type="text" name="data" (keyup)="onKey($event)" maxLength="15" />
        </form>
        <div style="display: flex; justify-content: center; margin-top: 10px">
            <button md-button (click)="onOkClick()">OK</button>
        </div>`,
})
export class InputDialogComponent {
    receivedInput: string;

    constructor(public dialog: MatDialogRef<InputDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: { title: string }) {}

    onOkClick() {
        this.dialog.close(this.receivedInput);
    }

    onKey(event: KeyboardEvent) {
        this.receivedInput = (event.target as HTMLInputElement).value;
    }

    onFormSubmit(event: Event) {
        event.preventDefault(); // Prevent the default form submission behavior
        this.onOkClick();
    }
}
