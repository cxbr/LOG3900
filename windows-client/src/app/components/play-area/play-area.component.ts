/* eslint-disable max-lines */
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { Canvas, Rectangle } from '@app/interfaces/creation-game';
import { DifferenceTry } from '@app/interfaces/difference-try';
import { Vec2 } from '@app/interfaces/vec2';
import { GameService } from '@app/services/game/game.service';
import { MouseService } from '@app/services/mouse/mouse.service';
import { ObserverService } from '@app/services/observer/observer.service';
import { PlayAreaService } from '@app/services/play-area/play-area.service';
import { GameRoom } from '@common/classes/game-room';
import { Color } from '@common/enums/color';
import { GameMode } from '@common/game-mode';
import { Subscription } from 'rxjs';
import { PossibleColor } from 'src/assets/variables/images-values';
import { Dimensions } from 'src/assets/variables/picture-dimension';

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
})
export class PlayAreaComponent implements AfterViewInit, OnChanges, OnDestroy {
    @ViewChild('canvas1', { static: false }) canvas1: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvas2', { static: false }) canvas2: ElementRef<HTMLCanvasElement>;

    @Input() gameRoom: GameRoom;
    @Input() timer: number;
    @Input() speed: number;
    @Input() pauseSignal: boolean = false;
    @Input() continueSignal: boolean = false;
    @Input() restartSignal: boolean = false;
    @Input() sources: string[];
    @Input() cheatLayers: HTMLCanvasElement[];
    @Input() isObserver = false;
    @Input() color = 'white';
    @Output() sendCheatStart = new EventEmitter<{ layer: HTMLCanvasElement }>();
    @Output() sendCheatEnd = new EventEmitter();
    @Output() sendHint = new EventEmitter<{ imageData: string; left: boolean }>();
    context1: CanvasRenderingContext2D;
    context2: CanvasRenderingContext2D;
    original = new Image();
    modified = new Image();
    cheatLayer: HTMLCanvasElement;
    hintLayer: HTMLCanvasElement;
    differenceMatrix: number[][];
    playerIsAllowedToClick = true;
    canvasDisabled = false;
    mousePosition: Vec2 = { x: 0, y: 0 };
    cheatModeSubscription: Subscription;
    srcCounter = 0;
    askingServerCheatMode = false;
    contextForeground1: CanvasRenderingContext2D;
    contextForeground2: CanvasRenderingContext2D;
    rectangleContext: CanvasRenderingContext2D;
    canvasForeground1: HTMLCanvasElement;
    canvasForeground2: HTMLCanvasElement;
    currentCanvas: HTMLCanvasElement;
    rectangleState: Rectangle;
    mousePressed = false;
    mouseInCanvas = true;
    belongsToCanvas1 = true;
    urlPath1: string;
    urlPath2: string;
    canvasTemp: Canvas;
    private canvasClicked: HTMLCanvasElement;
    private buttonPressed = '';
    private audioValid = new Audio('assets/sounds/valid_sound.mp3');
    private audioInvalid = new Audio('assets/sounds/invalid_sound.mp3');
    private canvasSize = { x: Dimensions.DefaultWidth, y: Dimensions.DefaultHeight };

    constructor(
        private observerService: ObserverService,
        private mouseService: MouseService,
        private gameService: GameService,
        private playAreaService: PlayAreaService,
    ) {}

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    @HostListener('document:keydown', ['$event'])
    buttonDetect(event: KeyboardEvent) {
        if (this.gameService.getIsTyping()) {
            return;
        }
        this.buttonPressed = event.key;
        if (this.buttonPressed === 't') {
            if (this.askingServerCheatMode) return;
            if (!this.playAreaService.isCheatModeOn) {
                this.askingServerCheatMode = true;
                this.gameService.isCheatModeOn();
            } else {
                this.playAreaService.isCheatModeOn = !this.playAreaService.isCheatModeOn;
                this.playAreaService.cheatMode();
            }
        }
    }

    ngAfterViewInit() {
        this.playAreaService.setSpeed(1);
        this.playAreaService.setCheatMode();
        this.gameRoom = this.gameService.gameRoom;
        this.gameService.serverValidateResponse$.subscribe((difference: DifferenceTry) => {
            if (difference.validated) {
                this.correctRetroaction(difference.differencePos, difference.username);
            } else if (difference.username === this.gameService.username) {
                this.errorRetroaction(this.canvasClicked);
            }
        });
        this.cheatModeSubscription = this.gameService.cheatModeResponse$.subscribe((isCheatModeOn: boolean) => {
            this.askingServerCheatMode = false;
            if (isCheatModeOn) {
                this.playAreaService.isCheatModeOn = !this.playAreaService.isCheatModeOn;
                this.playAreaService.cheatMode();
            }
        });
        this.observerService.setComponent(this);
        this.setContexts();
        this.setForegroundContexts();

        this.mousePosition = { x: 0, y: 0 };
        this.setRectangleContext();
        this.setTempCanvas();

        this.playAreaService.setComponent(this);
        this.playAreaService.setContexts();
    }

    ngOnChanges() {
        this.original.crossOrigin = 'Anonymous'; // needed to get access to images of server
        this.modified.crossOrigin = 'Anonymous';

        if (
            this.gameService.gameRoom &&
            this.gameService.gameData &&
            (this.gameService.gameRoom.userGame.nbDifferenceFound === 0 || this.gameService.gameRoom.gameMode === GameMode.limitedTimeMode)
        ) {
            this.differenceMatrix = this.gameService.gameData.differenceMatrix;
            this.original.src = this.gameService.gameData.image1url;
            this.modified.src = this.gameService.gameData.image2url;
        }

        let imageLoaded = 0;
        this.original.onload = () => {
            imageLoaded++;
            if (imageLoaded === 2) {
                this.drawImages();
            }
        };

        this.modified.onload = () => {
            imageLoaded++;
            if (imageLoaded === 2) {
                this.drawImages();
            }
        };
    }

    drawImages() {
        if (this.gameService.isLimitedTimeMode()) {
            this.playAreaService.drawImages(this.differenceMatrix);
        } else {
            this.playAreaService.handleImageLoad(this.context1, this.original);
            this.playAreaService.handleImageLoad(this.context2, this.modified);
        }
        this.verifyDifferenceMatrix('cheat');
        this.urlPath1 = this.context1.canvas.toDataURL();
        this.urlPath2 = this.context2.canvas.toDataURL();
        if (this.playAreaService.recordStateTimer) return;
        this.playAreaService.saveGameState();
    }

    handleCanvasEvent(eventType: string, event: MouseEvent, canvas: HTMLCanvasElement) {
        this.observerService.handleCanvasEvent(eventType, event, canvas);
    }

    async mouseClickAttempt(event: MouseEvent, canvas: HTMLCanvasElement) {
        if (
            this.playerIsAllowedToClick &&
            !this.gameService.gameRoom.userGame.observers?.some((observer) => observer.username === this.gameService.username)
        ) {
            this.mousePosition = this.mouseService.mouseClick(event, this.mousePosition);
            const isValidated = this.differenceMatrix[this.mousePosition.y][this.mousePosition.x] !== PossibleColor.EMPTYPIXEL;
            if (isValidated) {
                this.gameService.sendServerValidate(this.mousePosition);
                this.canvasClicked = canvas;
            } else {
                this.errorRetroaction(canvas);
            }
        }
    }

    verifyDifferenceMatrix(option: string): void {
        if (option === 'cheat') {
            this.cheatLayer = this.playAreaService.createAndFillNewLayer(Color.Cheat, true, false, this.differenceMatrix);
        }
    }

    loadNextGame() {
        if (!this.gameService.isLimitedTimeMode()) return;
        this.gameService.loadNextGame();
        this.gameService.changeTime(this.gameService.gameConstants.bonusTime);
        this.ngOnChanges();
    }

    ngOnDestroy(): void {
        if (this.cheatModeSubscription) {
            this.cheatModeSubscription.unsubscribe();
        }
        this.playAreaService.endCheatMode();
        this.gameService.turnOffGameSocket();
    }

    sendMatrixToServer(username: string) {
        this.gameService.sendServerDifference(this.differenceMatrix, username);
    }

    updateContext(context: CanvasRenderingContext2D, canvasForeground: HTMLCanvasElement, background: string) {
        const imageToDraw = new Image();
        imageToDraw.src = background;
        imageToDraw.onload = () => {
            context.drawImage(imageToDraw, 0, 0, this.width, this.height);
            context.drawImage(canvasForeground, 0, 0, this.width, this.height);
        };
    }

    private setContexts() {
        const context1Init = this.canvas1.nativeElement.getContext('2d');
        if (context1Init) this.context1 = context1Init;
        const context2Init = this.canvas2.nativeElement.getContext('2d');
        if (context2Init) this.context2 = context2Init;
    }

    private setForegroundContexts() {
        this.canvasForeground1 = this.observerService.createNewCanvas();
        this.canvasForeground2 = this.observerService.createNewCanvas();

        const contextForeground1 = this.canvasForeground1.getContext('2d');
        if (contextForeground1) this.contextForeground1 = contextForeground1;
        const contextForeground2 = this.canvasForeground2.getContext('2d');
        if (contextForeground2) this.contextForeground2 = contextForeground2;
    }

    private setRectangleContext() {
        const canvasRectangle = this.observerService.createNewCanvas();
        const contextRectangle = canvasRectangle.getContext('2d');
        if (contextRectangle) this.rectangleState = { canvas: canvasRectangle, context: contextRectangle, startPos: this.mousePosition };
    }

    private setTempCanvas() {
        const canvasTmp = this.observerService.createNewCanvas();
        const canvasTmpCtx = canvasTmp.getContext('2d');
        if (canvasTmpCtx) this.canvasTemp = { canvas: canvasTmp, context: canvasTmpCtx };
    }

    private correctRetroaction(differencePos: Vec2, username: string) {
        this.playerIsAllowedToClick = false;
        this.audioValid.pause();
        this.audioValid.currentTime = 0;
        this.audioValid.play();
        this.playAreaService.correctAnswerVisuals(this.gameService.findDifference(differencePos), username);
    }

    private errorRetroaction(canvas: HTMLCanvasElement) {
        this.playerIsAllowedToClick = false;
        this.audioInvalid.play();
        this.playAreaService.errorAnswerVisuals(canvas, this.mousePosition);
    }
}
