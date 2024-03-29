import {Group, Object3D, PointLight, Raycaster, Vector2, Vector3} from 'three';
import {Intersection} from 'three/src/core/Raycaster';
import EditorContext from './EditorContext';
import {Object3DUserData} from './model/components/CObject3D';
import ArcRotateCamera from './utils/camera/ArcRotateCamera';
import Gizmo from './utils/Gizmo';
import Input from './utils/Input';

/** Sub view window context of the 3d canvas */
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
    gizmo = new Gizmo();
    gizmoEnabled = false;
    defaultLights: Group;
    defaultLight1: PointLight;
    defaultLight2: PointLight;
    defaultLight3: PointLight;

    constructor(ctx: EditorContext,
                index: number,
                element: HTMLElement,
                cameraAlpha: number,
                cameraBeta: number,
                cameraPerspective: boolean
    ) {
        this.ctx = ctx;
        this.index = index;
        this.element = element;

        this.input.setup(element);

        this.camera.alpha = cameraAlpha;
        this.camera.beta = cameraBeta;
        this.camera.perspective = cameraPerspective;

        ctx.scene.add(this.gizmo);
        this.gizmo.visible = false;

        this.defaultLights = new Group();
        ctx.scene.add(this.defaultLights);
        this.defaultLight1 = new PointLight(0xffffff, .35);
        this.defaultLight2 = new PointLight(0xffffff, .35);
        this.defaultLight3 = new PointLight(0xffffff, .35);
        this.defaultLight1.position.set(0, 2, 0);
        this.defaultLight2.position.set(-2, -1, 0);
        this.defaultLight3.position.set(2, -1, 0);
        this.defaultLights.add(this.defaultLight1);
        this.defaultLights.add(this.defaultLight2);
        this.defaultLights.add(this.defaultLight3);
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
        this.defaultLight1.dispose();
        this.defaultLight2.dispose();
        this.defaultLight3.dispose();
        this.input.unload();
    }

    mousePick(type?: string) {
        return this.raycaster.intersectObjects(this.ctx.readonlyRef().scene.children.filter(
            obj => {
                if (!obj.visible) {
                    return false;
                }
                const node = (obj.userData as Object3DUserData).node;
                if (!node?.visible) {
                    return false;
                }
                return !type || node.type === type;
            }
        ))
            .filter(item => {
                const node = (item.object.userData as Object3DUserData).node;
                return node?.visible;
            });
    }

    mousePickVisible() {
        const objects = this.ctx.readonlyRef().scene.children.filter(
            obj => {
                if (!obj.visible) {
                    return false;
                }
                const node = (obj.userData as Object3DUserData).node;
                return node?.visible;
            }
        );
        const intersectObjects = (object: Object3D, raycaster: Raycaster, intersects: Intersection[]) => {
            if (!object.visible) {
                return;
            }
            if (object.layers.test(raycaster.layers)) {
                object.raycast(raycaster, intersects);
            }
            for (let child of object.children) {
                intersectObjects(child, raycaster, intersects);
            }
        };
        const intersects: Intersection[] = [];
        for (let object of objects) {
            intersectObjects(object, this.raycaster, intersects);
        }
        return intersects.sort((a, b) => a.distance - b.distance);
    }
}
