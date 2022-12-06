import {DirectionalLight, Raycaster, Vector2, Vector3} from 'three';
import {TransformControls} from 'three/examples/jsm/controls/TransformControls';
import EditorContext from './EditorContext';
import {Object3DUserData} from './model/components/CObject3D';
import ArcRotateCamera from './utils/camera/ArcRotateCamera';
import Input from './utils/Input';

export default class EditorView {
    ctx: EditorContext;
    index: number;
    enabled: boolean = true;
    element: HTMLElement;
    camera = new ArcRotateCamera();
    zoomLevel = 0;
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
    transformControls: TransformControls;
    defaultLight: DirectionalLight;

    constructor(ctx: EditorContext,
                index: number,
                element: HTMLElement,
                alpha: number = 0,
                beta: number = 0,
                perspective: boolean = true
    ) {
        this.ctx = ctx;
        this.index = index;
        this.element = element;
        this.input.setup(element);
        this.camera.alpha = alpha;
        this.camera.beta = beta;
        this.camera.perspective = perspective;
        this.transformControls = new TransformControls(this.camera.get(), element);
        ctx.scene.add(this.transformControls);
        this.defaultLight = new DirectionalLight();
        ctx.scene.add(this.defaultLight);
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
        this.transformControls.dispose();
        this.defaultLight.dispose();
        this.input.unload();
    }

    mousePick() {
        return this.raycaster.intersectObjects(this.ctx.readonlyRef().scene.children.filter(
            obj => obj.visible && !!(obj.userData as Object3DUserData).node
        ));
    }
}
