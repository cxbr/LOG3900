/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { Vec2 } from 'src/app/interfaces/vec2';
import { MouseButton } from 'src/assets/variables/mouse-button';
import { Time } from 'src/assets/variables/time';

@Injectable({
    providedIn: 'root',
})
export class ObserverService {
    private component: PlayAreaComponent;
    private width: number;
    private height: number;

    setComponent(component: PlayAreaComponent) {
        this.component = component;
        this.width = this.component.width;
        this.height = this.component.height;
    }

    handleCanvasEvent(eventType: string, event: MouseEvent, canvas: HTMLCanvasElement) {
        if (!this.component.isObserver) return;
        if (this.component.canvasDisabled) return;
        if (eventType === 'mousedown') {
            this.component.currentCanvas = canvas;
        }

        if (this.component.currentCanvas === canvas) {
            let context = this.component.contextForeground1;
            if (canvas === this.component.canvas2.nativeElement) {
                context = this.component.contextForeground2;
            }

            switch (eventType) {
                case 'mousedown':
                    this.handleMouseDown(event, context);
                    break;
                case 'mousemove':
                    this.handleMouseMove(event, context);
                    break;
                case 'mouseup':
                    this.handleMouseUp(canvas, context);
                    break;
                case 'mouseleave':
                    this.handleMouseLeave(event, context);
                    break;
                case 'mouseenter':
                    this.handleMouseEnter(event);
                    break;
            }
        }
        this.updateCanvas1Display();
        this.updateCanvas2Display();
    }

    handleMouseUp(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.component.mousePressed = false;
        this.component.playerIsAllowedToClick = false;
        this.component.canvasDisabled = true;
        const currentCtx = this.component.currentCanvas.getContext('2d');
        const canvasCtx = canvas.getContext('2d');
        if (currentCtx === null || canvasCtx === null) return;
        if (context === this.component.contextForeground1) {
            this.component.sendHint.emit({ imageData: this.component.canvasForeground1.toDataURL(), left: true });
        } else {
            this.component.sendHint.emit({ imageData: this.component.canvasForeground2.toDataURL(), left: false });
        }
        if (this.component) {
            this.component.contextForeground1.clearRect(0, 0, this.component.width, this.component.height);
            this.component.contextForeground2.clearRect(0, 0, this.component.width, this.component.height);
            this.component.context1.drawImage(this.component.original, 0, 0, this.component.width, this.component.height);
            this.component.context2.drawImage(this.component.modified, 0, 0, this.component.width, this.component.height);
        }
        setTimeout(() => {
            this.component.playerIsAllowedToClick = true;
            this.component.canvasDisabled = false;
        }, 3 * Time.Thousand);
    }

    updateRectangle() {
        this.drawRectangle(this.component.rectangleContext, this.component.mousePosition);
        this.updateCanvas1Display();
        this.updateCanvas2Display();
    }

    createNewCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        return canvas;
    }

    private handleMouseDown(event: MouseEvent, context: CanvasRenderingContext2D) {
        if (event.button === MouseButton.Left) {
            this.component.mousePosition = { x: event.offsetX, y: event.offsetY };
            this.component.mousePressed = true;
            this.component.mouseInCanvas = true;
            this.component.rectangleContext = context;
            this.component.rectangleState.context.fillStyle = this.component.color;
            this.component.rectangleState.startPos = this.component.mousePosition;
            this.component.canvasTemp.context.clearRect(0, 0, this.width, this.height);
            this.component.canvasTemp.context.globalAlpha = 0.5;
            this.component.contextForeground1.globalAlpha = 0.5;
            this.component.contextForeground2.globalAlpha = 0.5;
            if (context === this.component.contextForeground1) {
                this.component.canvasTemp.context.drawImage(this.component.canvasForeground1, 0, 0, this.width, this.height);
            } else {
                this.component.canvasTemp.context.drawImage(this.component.canvasForeground2, 0, 0, this.width, this.height);
            }
        }
    }

    private handleMouseMove(event: MouseEvent, context: CanvasRenderingContext2D) {
        if (event.button === MouseButton.Left) {
            const finish: Vec2 = { x: event.offsetX, y: event.offsetY };

            if (this.component.mousePressed && this.component.mouseInCanvas) {
                this.drawRectangle(context, finish);
            }
        }
    }

    private handleMouseLeave(event: MouseEvent, context: CanvasRenderingContext2D) {
        this.component.mouseInCanvas = false;
        this.component.mousePosition = { x: event.offsetX, y: event.offsetY };

        if (this.component.mousePressed) {
            const finish: Vec2 = { x: event.offsetX, y: event.offsetY };
            this.drawRectangle(context, finish);
        }
    }

    private handleMouseEnter(event: MouseEvent) {
        this.component.mousePosition = { x: event.offsetX, y: event.offsetY };
        this.component.mouseInCanvas = true;
    }

    private drawRectangle(context: CanvasRenderingContext2D, pos: Vec2) {
        const x = this.component.rectangleState.startPos.x;
        const y = this.component.rectangleState.startPos.y;
        const width = pos.x - x;
        const height = pos.y - y;
        this.component.rectangleState.context.clearRect(0, 0, this.width, this.height);
        this.component.rectangleState.context.fillRect(x, y, width, height);
        context.clearRect(0, 0, this.width, this.height);
        context.drawImage(this.component.canvasTemp.canvas, 0, 0, this.width, this.height);
        context.drawImage(this.component.rectangleState.canvas, 0, 0, this.width, this.height);
        this.component.mousePosition = pos;
    }

    private updateCanvas1Display() {
        if (!this.component.urlPath1 || this.component.urlPath1.trim() === '') {
            this.component.context1.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.component.context1.fillRect(0, 0, this.width, this.height);
            this.component.context1.drawImage(this.component.canvasForeground1, 0, 0, this.width, this.height);
        } else {
            this.component.updateContext(this.component.context1, this.component.canvasForeground1, this.component.urlPath1);
        }
    }

    private updateCanvas2Display() {
        if (!this.component.urlPath2 || this.component.urlPath2.trim() === '') {
            this.component.context2.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.component.context2.fillRect(0, 0, this.width, this.height);
            this.component.context2.drawImage(this.component.canvasForeground2, 0, 0, this.width, this.height);
        } else {
            this.component.updateContext(this.component.context2, this.component.canvasForeground2, this.component.urlPath2);
        }
    }
}
