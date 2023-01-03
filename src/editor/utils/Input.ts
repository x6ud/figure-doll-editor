import {MouseButton} from './MouseButton';

export default class Input {

    element?: HTMLElement;
    pointerOver: boolean = false;
    pointerX: number = 0;
    pointerY: number = 0;
    pressure: number = 0;
    mouseLeft: boolean = false;
    mouseLeftDownThisFrame: boolean = false;
    mouseRight: boolean = false;
    mouseRightDownThisFrame: boolean = false;
    mouseMiddle: boolean = false;
    mouseMiddleDownThisFrame: boolean = false;
    wheelDetX: number = 0;
    wheelDetY: number = 0;

    private readonly onContextmenu: (e: MouseEvent) => void;
    private readonly onPointerMove: (e: PointerEvent) => void;
    private readonly onPointerDown: (e: PointerEvent) => void;
    private readonly onPointerUp: (e: PointerEvent) => void;
    private readonly onPointerLeave: () => void;
    private readonly onPointerOut: (e: PointerEvent) => void;
    private readonly onWheel: (e: WheelEvent) => void;
    private readonly onKeyDown: (e: KeyboardEvent) => void;
    private readonly onKeyUp: (e: KeyboardEvent) => void;
    private readonly onBlur: () => void;

    private readonly keyMap: Map<string, number> = new Map();

    private timestamp: number = 0;

    constructor() {
        this.onContextmenu = (e: MouseEvent) => {
            if (e.target !== this.element) {
                return;
            }
            e.preventDefault();
        };
        this.onPointerMove = (e: PointerEvent) => {
            if (e.target !== this.element) {
                return;
            }
            this.pressure = e.pressure;
            this.pointerOver = true;
            this.pointerX = e.offsetX;
            this.pointerY = e.offsetY;
        };
        this.onPointerDown = (e: PointerEvent) => {
            if (e.target !== this.element) {
                return;
            }
            this.pressure = e.pressure;
            switch (e.button) {
                case MouseButton.LEFT:
                    this.mouseLeft = true;
                    this.mouseLeftDownThisFrame = true;
                    break;
                case MouseButton.MIDDLE:
                    this.mouseMiddle = true;
                    this.mouseMiddleDownThisFrame = true;
                    break;
                case MouseButton.RIGHT:
                    this.mouseRight = true;
                    this.mouseRightDownThisFrame = true;
                    break;
            }
        };
        this.onPointerUp = (e: PointerEvent) => {
            this.pressure = e.pressure;
            switch (e.button) {
                case MouseButton.LEFT:
                    this.mouseLeft = false;
                    this.mouseLeftDownThisFrame = false;
                    break;
                case MouseButton.MIDDLE:
                    this.mouseMiddle = false;
                    this.mouseMiddleDownThisFrame = false;
                    break;
                case MouseButton.RIGHT:
                    this.mouseRight = false;
                    this.mouseLeftDownThisFrame = false;
                    break;
            }
        };
        this.onPointerLeave = () => {
            this.pressure = 0;
            this.pointerOver = false;
        };
        this.onPointerOut = (e: PointerEvent) => {
            if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
                this.pressure = 0;
                this.mouseLeft = false;
                this.mouseLeftDownThisFrame = false;
                this.mouseRight = false;
                this.mouseLeftDownThisFrame = false;
            }
        };
        this.onWheel = (e: WheelEvent) => {
            e.preventDefault();
            this.wheelDetX += e.deltaX / 100;
            this.wheelDetY += e.deltaY / 100;
        };
        this.onKeyDown = (e: KeyboardEvent) => {
            const target = e.target;
            if (target && 'tagName' in target && (target as HTMLElement).tagName === 'INPUT') {
                return;
            }
            if (e.altKey || e.ctrlKey || e.key === 'Tab') {
                e.preventDefault();
            }
            if (!this.keyMap.has(e.key)) {
                this.keyMap.set(e.key, this.timestamp);
            }
        };
        this.onKeyUp = (e: KeyboardEvent) => {
            const target = e.target;
            if (target && 'tagName' in target && (target as HTMLElement).tagName === 'INPUT') {
                return;
            }
            this.keyMap.delete(e.key);
        };
        this.onBlur = () => {
            this.keyMap.clear();
        };
    }

    setup(element: HTMLElement) {
        this.unload();
        this.element = element;
        element.addEventListener('contextmenu', this.onContextmenu);
        element.addEventListener('pointermove', this.onPointerMove);
        element.addEventListener('pointerdown', this.onPointerDown);
        element.addEventListener('pointerleave', this.onPointerLeave);
        document.addEventListener('pointerup', this.onPointerUp);
        document.addEventListener('pointerout', this.onPointerOut);
        element.addEventListener('wheel', this.onWheel);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
    }

    unload() {
        const element = this.element;
        if (!element) {
            return;
        }
        element.removeEventListener('contextmenu', this.onContextmenu);
        element.removeEventListener('pointermove', this.onPointerMove);
        element.removeEventListener('pointerdown', this.onPointerDown);
        element.removeEventListener('pointerleave', this.onPointerLeave);
        document.removeEventListener('pointerup', this.onPointerUp);
        document.removeEventListener('pointerout', this.onPointerOut);
        element.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
        this.element = undefined;
    }

    update() {
        this.mouseLeftDownThisFrame = false;
        this.mouseRightDownThisFrame = false;
        this.mouseMiddleDownThisFrame = false;
        this.wheelDetX = 0;
        this.wheelDetY = 0;
        this.timestamp = Date.now();
    }

    isKeyPressed(key: string): boolean {
        return this.keyMap.has(key);
    }

    isKeyPressedThisFrame(key: string): boolean {
        return this.keyMap.get(key) === this.timestamp;
    }

    isKeyRepeated(key: string, ms: number = 150) {
        const time = this.keyMap.get(key);
        if (time == null) {
            return false;
        }
        const dt = this.timestamp - time;
        if (dt >= ms || dt === 0) {
            this.keyMap.set(key, this.timestamp);
            return true;
        }
        return false;
    }

}
