import {Raycaster, Vector2, Vector3} from 'three';
import ArcRotateCamera from './utils/camera/ArcRotateCamera';
import Input from './utils/Input';

export default class EditorView {
    index: number;
    enabled: boolean = true;
    element: HTMLElement;
    camera = new ArcRotateCamera();
    left: number = 0;
    bottom: number = 0;
    width: number = 0;
    height: number = 0;
    input = new Input();
    mouseScr = new Vector2();
    mouseNdc = new Vector3();
    mouseRay0 = new Vector3();
    mouseRay1 = new Vector3();
    mouseRayN = new Vector3();
    raycaster = new Raycaster();
    zoomLevel = 0;

    constructor(index: number, element: HTMLElement, alpha: number = 0, beta: number = 0, perspective: boolean = true) {
        this.index = index;
        this.element = element;
        this.camera.alpha = alpha;
        this.camera.beta = beta;
        this.camera.perspective = perspective;
        this.input.setup(element);
    }

    update() {
        const rect = this.element.getBoundingClientRect();
        this.left = rect.left;
        this.bottom = rect.bottom;
        this.width = rect.width;
        this.height = rect.height;
        if (this.width && this.height) {
            this.camera.update(this.width, this.height);
        } else {
            this.enabled = false;
        }
    }

    dispose() {
        this.input.unload();
    }
}
