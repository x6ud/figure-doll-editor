import {
    BoxGeometry,
    CircleGeometry,
    CylinderGeometry,
    Group,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    Quaternion,
    Raycaster,
    TorusGeometry,
    Vector3
} from 'three';
import ArcRotateCamera from './camera/ArcRotateCamera';
import Input from './Input';
import {
    angleBetween2VectorsInPanel,
    closestPointsBetweenTwoLines,
    linePanelIntersection,
    quatFromForwardUp,
    raySphereIntersect,
    simplifyAngle,
    snapPoint
} from './math';

const COLOR_X = 0xF63652;
const COLOR_Y = 0x6FA51B;
const COLOR_Z = 0x2F83E3;

const whiteMaterial = new MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    transparent: true,
    opacity: 0.5
});
const meshMaterial = new MeshBasicMaterial({
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    transparent: true
});
const xAxisMaterial = meshMaterial.clone();
xAxisMaterial.color.setHex(COLOR_X);
const yAxisMaterial = meshMaterial.clone();
yAxisMaterial.color.setHex(COLOR_Y);
const zAxisMaterial = meshMaterial.clone();
zAxisMaterial.color.setHex(COLOR_Z);

const PICKER_PADDING = 0.035;
const TRANSLATE_HANDLER_OFFSET = 0.5 + 0.06;
const FREE_TRANSLATE_HANDLER_RADIUS = 0.1 + PICKER_PADDING;
const ROTATE_HANDLER_RADIUS = 0.5 - 0.08;
const FREE_ROTATE_PICKER_RADIUS = ROTATE_HANDLER_RADIUS - 0.02;
const VIEW_ROTATE_HANDLER_RADIUS = 0.5;
const SCALE_HANDLER_SIZE = 0.06;
const SCALE_HANDLER_OFFSET = ROTATE_HANDLER_RADIUS - 0.08;
const SCALE_PANEL_PICKER_SIZE = 0.08;

const _xAxis = new Vector3();
const _yAxis = new Vector3();
const _zAxis = new Vector3();
const _v1 = new Vector3();
const _v2 = new Vector3();
const _cross = new Vector3();
const _localDir = new Vector3();
const _m = new Matrix4();
const _mouse1 = new Vector3();
const _q = new Quaternion();
const _axis = new Vector3();
const _dir = new Vector3();
const _forward = new Vector3();
const _up = new Vector3();

export default class Gizmo extends Group {
    private translateArrowX: Mesh;
    private translateArrowY: Mesh;
    private translateArrowZ: Mesh;
    private translatePickerX: Object3D;
    private translatePickerY: Object3D;
    private translatePickerZ: Object3D;
    private freeTranslateHandler: Mesh;
    private freeTranslatePicker: Object3D;

    private rotateCircleX: Mesh;
    private rotateCircleY: Mesh;
    private rotateCircleZ: Mesh;
    private rotatePickerX: Object3D;
    private rotatePickerY: Object3D;
    private rotatePickerZ: Object3D;
    private rotateHandlerX: Object3D;
    private rotateHandlerY: Object3D;
    private rotateHandlerZ: Object3D;
    private freeRotatePicker: Mesh;
    private viewRotateCircle: Mesh;
    private viewRotatePicker: Object3D;

    private scaleHandlers: Object3D;
    private scaleCubeX: Mesh;
    private scaleCubeY: Mesh;
    private scaleCubeZ: Mesh;
    private scaleAxisX: Mesh;
    private scaleAxisY: Mesh;
    private scaleAxisZ: Mesh;
    private scalePickerX: Object3D;
    private scalePickerY: Object3D;
    private scalePickerZ: Object3D;
    private scalePickerYZ: Mesh;
    private scalePickerXZ: Mesh;
    private scalePickerXY: Mesh;

    private pickers: Object3D[];

    size: number = 0.25;
    orientation: 'world' | 'local' = 'local';
    forcePositiveScale: boolean = true;
    translateSnap: number = 0.05;
    rotateSnap: number = 45 / 180 * Math.PI;

    enableTranslate: boolean = true;
    enableRotate: boolean = true;
    enableScale: boolean = true;

    dragStart: boolean = false;
    dragging: boolean = false;
    mode?: 'translate' | 'rotate' | 'scale';
    handler?:
        | 'translate-x'
        | 'translate-y'
        | 'translate-z'
        | 'translate-free'
        | 'rotate-x'
        | 'rotate-y'
        | 'rotate-z'
        | 'rotate-free'
        | 'rotate-view'
        | 'scale-x'
        | 'scale-y'
        | 'scale-z'
        | 'scale-yz'
        | 'scale-xz'
        | 'scale-xy';
    position0 = new Vector3();
    rotation0 = new Quaternion();
    scale0 = new Vector3();
    position1 = new Vector3();
    rotation1 = new Quaternion();
    scale1 = new Vector3();
    detTranslation = new Vector3();
    detRotation = new Quaternion();
    detScale = new Vector3();
    private mouse0 = new Vector3();
    private axis = new Vector3();
    private raycastPanel: boolean = false;

    constructor() {
        super();

        this.renderOrder = 1;

        // translate handler

        const arrowGeometry = new CylinderGeometry(0, 0.04, 0.1, 12);
        arrowGeometry.translate(0, 0.1 / 2, 0);
        this.translateArrowX = new Mesh(arrowGeometry, xAxisMaterial.clone());
        this.translateArrowY = new Mesh(arrowGeometry, yAxisMaterial.clone());
        this.translateArrowZ = new Mesh(arrowGeometry, zAxisMaterial.clone());
        this.translateArrowX.position.set(TRANSLATE_HANDLER_OFFSET, 0, 0);
        this.translateArrowX.rotation.set(0, 0, -Math.PI / 2);
        this.translateArrowY.position.set(0, TRANSLATE_HANDLER_OFFSET, 0);
        this.translateArrowY.rotation.set(0, 0, 0);
        this.translateArrowZ.position.set(0, 0, TRANSLATE_HANDLER_OFFSET);
        this.translateArrowZ.rotation.set(Math.PI / 2, 0, 0);
        this.add(this.translateArrowX);
        this.add(this.translateArrowY);
        this.add(this.translateArrowZ);

        const translatePickerGeometry = new CylinderGeometry(
            PICKER_PADDING, 0.04 + PICKER_PADDING, 0.1 + PICKER_PADDING, 12);
        translatePickerGeometry.translate(0, 0.1 / 2, 0);
        this.translatePickerX = new Mesh(translatePickerGeometry, whiteMaterial);
        this.translatePickerY = new Mesh(translatePickerGeometry, whiteMaterial);
        this.translatePickerZ = new Mesh(translatePickerGeometry, whiteMaterial);
        this.translatePickerX.position.copy(this.translateArrowX.position);
        this.translatePickerX.rotation.copy(this.translateArrowX.rotation);
        this.translatePickerY.position.copy(this.translateArrowY.position);
        this.translatePickerY.rotation.copy(this.translateArrowY.rotation);
        this.translatePickerZ.position.copy(this.translateArrowZ.position);
        this.translatePickerZ.rotation.copy(this.translateArrowZ.rotation);
        this.add(this.translatePickerX);
        this.add(this.translatePickerY);
        this.add(this.translatePickerZ);
        this.translatePickerX.visible = false;
        this.translatePickerY.visible = false;
        this.translatePickerZ.visible = false;
        this.translatePickerX.userData.name = 'translate-x';
        this.translatePickerY.userData.name = 'translate-y';
        this.translatePickerZ.userData.name = 'translate-z';

        this.freeTranslateHandler = new Mesh(
            new TorusGeometry(FREE_TRANSLATE_HANDLER_RADIUS, 0.0075, 3, 64, Math.PI * 2),
            whiteMaterial.clone()
        );
        this.add(this.freeTranslateHandler);
        this.freeTranslatePicker = new Mesh(
            new CircleGeometry(FREE_TRANSLATE_HANDLER_RADIUS, 64),
            whiteMaterial.clone()
        );
        this.add(this.freeTranslatePicker);
        this.freeTranslatePicker.visible = false;
        this.freeTranslatePicker.userData.name = 'translate-free';

        // scale handler

        this.scaleHandlers = new Group();
        this.add(this.scaleHandlers);

        const boxGeometry = new BoxGeometry(SCALE_HANDLER_SIZE, SCALE_HANDLER_SIZE, SCALE_HANDLER_SIZE);
        this.scaleCubeX = new Mesh(boxGeometry, xAxisMaterial.clone());
        this.scaleCubeY = new Mesh(boxGeometry, yAxisMaterial.clone());
        this.scaleCubeZ = new Mesh(boxGeometry, zAxisMaterial.clone());
        this.scaleCubeX.position.set(SCALE_HANDLER_OFFSET, 0, 0);
        this.scaleCubeY.position.set(0, SCALE_HANDLER_OFFSET, 0);
        this.scaleCubeZ.position.set(0, 0, SCALE_HANDLER_OFFSET);
        this.scaleHandlers.add(this.scaleCubeX);
        this.scaleHandlers.add(this.scaleCubeY);
        this.scaleHandlers.add(this.scaleCubeZ);

        const axisGeometry = new BoxGeometry(SCALE_HANDLER_OFFSET - FREE_TRANSLATE_HANDLER_RADIUS - SCALE_HANDLER_SIZE / 2, 0.01, 0.01);
        axisGeometry.translate((SCALE_HANDLER_OFFSET - FREE_TRANSLATE_HANDLER_RADIUS - SCALE_HANDLER_SIZE / 2) / 2, 0, 0);
        this.scaleAxisX = new Mesh(axisGeometry, this.scaleCubeX.material);
        this.scaleAxisY = new Mesh(axisGeometry, this.scaleCubeY.material);
        this.scaleAxisZ = new Mesh(axisGeometry, this.scaleCubeZ.material);
        this.scaleAxisX.position.set(FREE_TRANSLATE_HANDLER_RADIUS, 0, 0);
        this.scaleAxisY.position.set(0, FREE_TRANSLATE_HANDLER_RADIUS, 0);
        this.scaleAxisZ.position.set(0, 0, FREE_TRANSLATE_HANDLER_RADIUS);
        this.scaleAxisX.rotation.set(0, 0, 0);
        this.scaleAxisY.rotation.set(0, 0, Math.PI / 2);
        this.scaleAxisZ.rotation.set(0, -Math.PI / 2, 0);
        this.scaleHandlers.add(this.scaleAxisX);
        this.scaleHandlers.add(this.scaleAxisY);
        this.scaleHandlers.add(this.scaleAxisZ);

        const scalePickerGeometry = new BoxGeometry(SCALE_HANDLER_SIZE + PICKER_PADDING, SCALE_HANDLER_SIZE + PICKER_PADDING, SCALE_HANDLER_SIZE + PICKER_PADDING);
        this.scalePickerX = new Mesh(scalePickerGeometry, whiteMaterial);
        this.scalePickerY = new Mesh(scalePickerGeometry, whiteMaterial);
        this.scalePickerZ = new Mesh(scalePickerGeometry, whiteMaterial);
        this.scalePickerX.position.copy(this.scaleCubeX.position);
        this.scalePickerY.position.copy(this.scaleCubeY.position);
        this.scalePickerZ.position.copy(this.scaleCubeZ.position);
        this.scaleHandlers.add(this.scalePickerX);
        this.scaleHandlers.add(this.scalePickerY);
        this.scaleHandlers.add(this.scalePickerZ);
        this.scalePickerX.visible = false;
        this.scalePickerY.visible = false;
        this.scalePickerZ.visible = false;
        this.scalePickerX.userData.name = 'scale-x';
        this.scalePickerY.userData.name = 'scale-y';
        this.scalePickerZ.userData.name = 'scale-z';

        const scalePanelPickerGeometry = new BoxGeometry(1e-7, SCALE_PANEL_PICKER_SIZE, SCALE_PANEL_PICKER_SIZE);
        this.scalePickerYZ = new Mesh(scalePanelPickerGeometry, xAxisMaterial);
        this.scalePickerXZ = new Mesh(scalePanelPickerGeometry, yAxisMaterial);
        this.scalePickerXY = new Mesh(scalePanelPickerGeometry, zAxisMaterial);
        this.scalePickerYZ.rotation.set(0, 0, 0);
        this.scalePickerYZ.position.set(0, FREE_TRANSLATE_HANDLER_RADIUS + SCALE_PANEL_PICKER_SIZE / 2, FREE_TRANSLATE_HANDLER_RADIUS + SCALE_PANEL_PICKER_SIZE / 2);
        this.scalePickerXZ.rotation.set(0, 0, Math.PI / 2);
        this.scalePickerXZ.position.set(FREE_TRANSLATE_HANDLER_RADIUS + SCALE_PANEL_PICKER_SIZE / 2, 0, FREE_TRANSLATE_HANDLER_RADIUS + SCALE_PANEL_PICKER_SIZE / 2);
        this.scalePickerXY.rotation.set(0, Math.PI / 2, 0);
        this.scalePickerXY.position.set(FREE_TRANSLATE_HANDLER_RADIUS + SCALE_PANEL_PICKER_SIZE / 2, FREE_TRANSLATE_HANDLER_RADIUS + SCALE_PANEL_PICKER_SIZE / 2, 0);
        this.scaleHandlers.add(this.scalePickerYZ);
        this.scaleHandlers.add(this.scalePickerXZ);
        this.scaleHandlers.add(this.scalePickerXY);
        this.scalePickerYZ.userData.name = 'scale-yz';
        this.scalePickerXZ.userData.name = 'scale-xz';
        this.scalePickerXY.userData.name = 'scale-xy';

        // rotate handler
        this.viewRotateCircle = new Mesh(
            new TorusGeometry(VIEW_ROTATE_HANDLER_RADIUS, 0.0075, 3, 64, Math.PI * 2),
            whiteMaterial
        );
        this.add(this.viewRotateCircle);
        this.viewRotatePicker = new Mesh(
            new TorusGeometry(VIEW_ROTATE_HANDLER_RADIUS - PICKER_PADDING, 0.0075 + PICKER_PADDING, 3, 64, Math.PI * 2),
            whiteMaterial
        );
        this.add(this.viewRotatePicker);
        this.viewRotatePicker.visible = false;
        this.viewRotatePicker.userData.name = 'rotate-view';

        this.freeRotatePicker = new Mesh(
            new CircleGeometry(FREE_ROTATE_PICKER_RADIUS, 64),
            whiteMaterial.clone()
        );
        (this.freeRotatePicker.material as MeshBasicMaterial).opacity = 0.2;
        this.add(this.freeRotatePicker);
        this.freeRotatePicker.visible = false;
        this.freeRotatePicker.userData.name = 'rotate-free';

        this.rotateHandlerX = new Object3D();
        this.rotateHandlerY = new Object3D();
        this.rotateHandlerZ = new Object3D();
        this.add(this.rotateHandlerX);
        this.add(this.rotateHandlerY);
        this.add(this.rotateHandlerZ);

        const circleGeometry = new TorusGeometry(ROTATE_HANDLER_RADIUS, 0.0075, 3, 64, Math.PI);
        circleGeometry.rotateY(Math.PI / 2);
        circleGeometry.rotateX(Math.PI / 2);
        this.rotateCircleX = new Mesh(circleGeometry, xAxisMaterial.clone());
        this.rotateCircleY = new Mesh(circleGeometry, yAxisMaterial.clone());
        this.rotateCircleZ = new Mesh(circleGeometry, zAxisMaterial.clone());
        this.rotateCircleX.rotation.set(0, 0, 0);
        this.rotateCircleY.rotation.set(0, 0, -Math.PI / 2);
        this.rotateCircleZ.rotation.set(0, Math.PI / 2, 0);
        this.rotateHandlerX.add(this.rotateCircleX);
        this.rotateHandlerY.add(this.rotateCircleY);
        this.rotateHandlerZ.add(this.rotateCircleZ);

        const rotatePickerGeometry = new TorusGeometry(0.45 - PICKER_PADDING, 0.0075 + PICKER_PADDING, 3, 64, Math.PI);
        rotatePickerGeometry.rotateY(Math.PI / 2);
        rotatePickerGeometry.rotateX(Math.PI / 2);
        this.rotatePickerX = new Mesh(rotatePickerGeometry, whiteMaterial);
        this.rotatePickerY = new Mesh(rotatePickerGeometry, whiteMaterial);
        this.rotatePickerZ = new Mesh(rotatePickerGeometry, whiteMaterial);
        this.rotatePickerY.rotation.copy(this.rotateCircleY.rotation);
        this.rotatePickerX.rotation.copy(this.rotateCircleX.rotation);
        this.rotatePickerZ.rotation.copy(this.rotateCircleZ.rotation);
        this.rotateHandlerX.add(this.rotatePickerX);
        this.rotateHandlerY.add(this.rotatePickerY);
        this.rotateHandlerZ.add(this.rotatePickerZ);
        this.rotatePickerX.visible = false;
        this.rotatePickerY.visible = false;
        this.rotatePickerZ.visible = false;
        this.rotatePickerX.userData.name = 'rotate-x';
        this.rotatePickerY.userData.name = 'rotate-y';
        this.rotatePickerZ.userData.name = 'rotate-z';

        this.pickers = [
            this.translatePickerX,
            this.translatePickerY,
            this.translatePickerZ,
            this.freeTranslatePicker,
            this.rotatePickerX,
            this.rotatePickerY,
            this.rotatePickerZ,
            this.freeRotatePicker,
            this.viewRotatePicker,
            this.scalePickerX,
            this.scalePickerY,
            this.scalePickerZ,
            this.scalePickerYZ,
            this.scalePickerXZ,
            this.scalePickerXY,
        ];
    }

    setTargetTransform(position: Vector3, rotation: Quaternion, scale: Vector3) {
        if (this.dragging) {
            return;
        }
        this.position0.copy(position);
        this.rotation0.copy(rotation);
        this.scale0.copy(scale);
    }

    setTargetTransformFromMatrix(mat: Matrix4) {
        if (this.dragging) {
            return;
        }
        mat.decompose(this.position0, this.rotation0, this.scale0);
        this.rotation0.normalize();
    }

    update(camera: ArcRotateCamera,
           raycaster: Raycaster,
           input: Input,
           mouseRay0: Vector3,
           mouseRay1: Vector3,
           mouseRayN: Vector3,
    ) {
        if (!this.visible) {
            return;
        }

        // update gizmo matrices
        this.position.copy(this.dragging ? this.position1 : this.position0);
        if (this.orientation === 'local') {
            this.quaternion.copy(this.dragging ? this.rotation1 : this.rotation0);
            this.scaleHandlers.quaternion.set(0, 0, 0, 1);
        } else {
            this.quaternion.set(0, 0, 0, 1);
            this.scaleHandlers.quaternion.copy(this.dragging ? this.rotation1 : this.rotation0);
        }

        this.updateWorldMatrix(false, false);
        _xAxis.set(1, 0, 0).transformDirection(this.matrixWorld);
        _yAxis.set(0, 1, 0).transformDirection(this.matrixWorld);
        _zAxis.set(0, 0, 1).transformDirection(this.matrixWorld);
        _m.copy(this.matrixWorld).invert();
        _localDir.copy(camera._dir).transformDirection(_m);

        let factor: number;
        if (camera.perspective) {
            const pc = camera.perspectiveCamera;
            factor = this.position.distanceTo(pc.position) * Math.min(1.9 * Math.tan(Math.PI * pc.fov / 360) / pc.zoom, 7);
        } else {
            const oc = camera.orthographicCamera;
            factor = (oc.top - oc.bottom) / oc.zoom;
        }
        this.scale.setScalar(factor * this.size);

        _v1.set(1, 0, 0);
        _v2.set(0, 0, 1);
        this.rotateHandlerX.quaternion.setFromAxisAngle(_v1, angleBetween2VectorsInPanel(_v1, _v2, _localDir));
        _v1.set(0, 1, 0);
        _v2.set(0, 0, 1);
        this.rotateHandlerY.quaternion.setFromAxisAngle(_v1, angleBetween2VectorsInPanel(_v1, _v2, _localDir));
        _v1.set(0, 0, 1);
        _v2.set(1, 0, 0);
        this.rotateHandlerZ.quaternion.setFromAxisAngle(_v1, angleBetween2VectorsInPanel(_v1, _v2, _localDir));

        _v1.set(0, 0, 1);
        this.viewRotateCircle.quaternion.setFromUnitVectors(_v1, _localDir);
        this.viewRotatePicker.quaternion.copy(this.viewRotateCircle.quaternion);
        this.freeTranslateHandler.quaternion.copy(this.viewRotateCircle.quaternion);
        this.freeTranslatePicker.quaternion.copy(this.freeTranslateHandler.quaternion);
        this.freeRotatePicker.quaternion.copy(this.viewRotateCircle.quaternion);

        for (let child of this.children) {
            child.updateWorldMatrix(false, true);
        }

        const xAxisVisible = _cross.crossVectors(camera._dir, _xAxis).lengthSq() > 1e-6;
        const yAxisVisible = _cross.crossVectors(camera._dir, _yAxis).lengthSq() > 1e-6;
        const zAxisVisible = _cross.crossVectors(camera._dir, _zAxis).lengthSq() > 1e-6;

        // handle input

        this.dragStart = false;
        if (!this.dragging) {
            // find hover
            let translateFree = false;
            let rotateFree = false;
            let rotateView = false;
            let axis:
                undefined
                | 'translate-x'
                | 'translate-y'
                | 'translate-z'
                | 'scale-x'
                | 'scale-y'
                | 'scale-z'
                | 'scale-yz'
                | 'scale-xz'
                | 'scale-xy'
                = undefined;
            let rotateAxis:
                undefined
                | 'rotate-x'
                | 'rotate-y'
                | 'rotate-z'
                = undefined;
            for (let result of raycaster.intersectObjects(this.pickers)) {
                switch (result.object.userData.name) {
                    case 'translate-x':
                        if (!axis && xAxisVisible && this.enableTranslate) {
                            axis = 'translate-x';
                        }
                        break;
                    case 'translate-y':
                        if (!axis && yAxisVisible && this.enableTranslate) {
                            axis = 'translate-y';
                        }
                        break;
                    case 'translate-z':
                        if (!axis && zAxisVisible && this.enableTranslate) {
                            axis = 'translate-z';
                        }
                        break;
                    case 'translate-free':
                        if (this.enableTranslate) {
                            translateFree = true;
                        }
                        break;
                    case 'rotate-x':
                        if (!rotateAxis && this.enableRotate) {
                            rotateAxis = 'rotate-x';
                        }
                        break;
                    case 'rotate-y':
                        if (!rotateAxis && this.enableRotate) {
                            rotateAxis = 'rotate-y';
                        }
                        break;
                    case 'rotate-z':
                        if (!rotateAxis && this.enableRotate) {
                            rotateAxis = 'rotate-z';
                        }
                        break;
                    case 'rotate-view':
                        if (this.enableRotate) {
                            rotateView = true;
                        }
                        break;
                    case 'rotate-free':
                        if (this.enableRotate) {
                            rotateFree = true;
                        }
                        break;
                    case 'scale-x':
                        if (!axis && xAxisVisible && this.enableScale) {
                            axis = 'scale-x';
                        }
                        break;
                    case 'scale-y':
                        if (!axis && yAxisVisible && this.enableScale) {
                            axis = 'scale-y';
                        }
                        break;
                    case 'scale-z':
                        if (!axis && zAxisVisible && this.enableScale) {
                            axis = 'scale-z';
                        }
                        break;
                    case 'scale-yz':
                        if (!axis && yAxisVisible && zAxisVisible && this.enableScale) {
                            axis = 'scale-yz';
                        }
                        break;
                    case 'scale-xz':
                        if (!axis && xAxisVisible && zAxisVisible && this.enableScale) {
                            axis = 'scale-xz';
                        }
                        break;
                    case 'scale-xy':
                        if (!axis && xAxisVisible && yAxisVisible && this.enableScale) {
                            axis = 'scale-xy';
                        }
                        break;
                }
            }
            this.handler = undefined;
            if (axis) {
                this.handler = axis;
            } else if (rotateAxis) {
                this.handler = rotateAxis;
            } else if (translateFree) {
                this.handler = 'translate-free';
            } else if (rotateFree) {
                this.handler = 'rotate-free';
            } else if (rotateView) {
                this.handler = 'rotate-view';
            }

            // update handlers visibilities and opacities
            this.updateOpacity(this.translateArrowX, this.handler === 'translate-x' || !this.handler);
            this.updateOpacity(this.translateArrowY, this.handler === 'translate-y' || !this.handler);
            this.updateOpacity(this.translateArrowZ, this.handler === 'translate-z' || !this.handler);
            this.updateOpacity(this.rotateCircleX, this.handler === 'rotate-x' || !this.handler);
            this.updateOpacity(this.rotateCircleY, this.handler === 'rotate-y' || !this.handler);
            this.updateOpacity(this.rotateCircleZ, this.handler === 'rotate-z' || !this.handler);
            this.updateOpacity(this.scaleCubeX, this.handler === 'scale-x' || !this.handler);
            this.updateOpacity(this.scaleCubeY, this.handler === 'scale-y' || !this.handler);
            this.updateOpacity(this.scaleCubeZ, this.handler === 'scale-z' || !this.handler);
            this.updateOpacity(this.scaleAxisX, this.handler === 'scale-x' || !this.handler);
            this.updateOpacity(this.scaleAxisY, this.handler === 'scale-y' || !this.handler);
            this.updateOpacity(this.scaleAxisZ, this.handler === 'scale-z' || !this.handler);
            this.updateOpacity(this.scalePickerYZ, this.handler === 'scale-yz' || !this.handler);
            this.updateOpacity(this.scalePickerXZ, this.handler === 'scale-xz' || !this.handler);
            this.updateOpacity(this.scalePickerXY, this.handler === 'scale-xy' || !this.handler);
            this.updateOpacity(this.viewRotateCircle, this.handler === 'rotate-view' || !this.handler);
            this.updateOpacity(this.freeTranslateHandler, this.handler === 'translate-free' || !this.handler);
            this.freeRotatePicker.visible = this.handler === 'rotate-free' && this.enableRotate;
            this.translateArrowX.visible = xAxisVisible && this.enableTranslate;
            this.translateArrowY.visible = yAxisVisible && this.enableTranslate;
            this.translateArrowZ.visible = zAxisVisible && this.enableTranslate;
            this.rotateCircleX.visible = this.enableRotate;
            this.rotateCircleY.visible = this.enableRotate;
            this.rotateCircleZ.visible = this.enableRotate;
            this.scaleCubeX.visible = this.scaleAxisX.visible = xAxisVisible && this.enableScale;
            this.scaleCubeY.visible = this.scaleAxisY.visible = yAxisVisible && this.enableScale;
            this.scaleCubeZ.visible = this.scaleAxisZ.visible = zAxisVisible && this.enableScale;
            this.scalePickerYZ.visible = yAxisVisible && zAxisVisible && this.enableScale;
            this.scalePickerXZ.visible = xAxisVisible && zAxisVisible && this.enableScale;
            this.scalePickerXY.visible = xAxisVisible && yAxisVisible && this.enableScale;
            this.viewRotateCircle.visible = true;
            this.freeTranslateHandler.visible = true;

            // mouse down
            if (input.mouseLeftDownThisFrame) {
                // drag start
                if (this.handler) {
                    this.dragStart = true;
                    this.dragging = true;
                    switch (this.handler) {
                        case 'translate-x':
                        case 'translate-y':
                        case 'translate-z': {
                            this.mode = 'translate';
                            this.axis.copy(this.handler === 'translate-x' ? _xAxis : (this.handler === 'translate-y' ? _yAxis : _zAxis));
                            closestPointsBetweenTwoLines(this.mouse0, null, this.position0, this.axis, mouseRay0, mouseRayN);
                        }
                            break;
                        case 'translate-free': {
                            this.mode = 'translate';
                            linePanelIntersection(this.mouse0, mouseRay0, mouseRay1, this.position0, mouseRayN);
                        }
                            break;
                        case 'rotate-x':
                        case 'rotate-y':
                        case 'rotate-z': {
                            this.mode = 'rotate';
                            this.axis.copy(this.handler === 'rotate-x' ? _xAxis : (this.handler === 'rotate-y' ? _yAxis : _zAxis));
                            let angle = simplifyAngle(Math.abs(mouseRayN.angleTo(this.axis)));
                            angle = angle / Math.PI * 180;
                            this.raycastPanel = Math.abs(angle - 90) > 15;
                            if (this.raycastPanel) {
                                linePanelIntersection(this.mouse0, mouseRay0, mouseRay1, this.position0, mouseRayN);
                            } else {
                                _dir.crossVectors(this.axis, camera._dir).normalize();
                                closestPointsBetweenTwoLines(this.mouse0, null, this.position0, _dir, mouseRay0, mouseRayN);
                            }
                        }
                            break;
                        case 'rotate-free': {
                            this.mode = 'rotate';
                            if (!raySphereIntersect(this.mouse0, mouseRay0, mouseRay1, this.position0, ROTATE_HANDLER_RADIUS * factor * this.size)) {
                                linePanelIntersection(this.mouse0, mouseRay0, mouseRay1, this.position0, camera._dir);
                            }
                        }
                            break;
                        case 'rotate-view': {
                            this.mode = 'rotate';
                            linePanelIntersection(this.mouse0, mouseRay0, mouseRay1, this.position0, mouseRayN);
                        }
                            break;
                        case 'scale-x':
                        case 'scale-y':
                        case 'scale-z': {
                            this.mode = 'scale';
                            this.raycastPanel = false;
                            switch (this.handler) {
                                case 'scale-x':
                                    this.axis.copy(_xAxis);
                                    break;
                                case 'scale-y':
                                    this.axis.copy(_yAxis);
                                    break;
                                case 'scale-z':
                                    this.axis.copy(_zAxis);
                                    break;
                            }
                            this.axis.applyQuaternion(this.scaleHandlers.quaternion);
                            closestPointsBetweenTwoLines(this.mouse0, null, this.position0, this.axis, mouseRay0, mouseRayN);
                        }
                            break;
                        case 'scale-yz':
                        case 'scale-xz':
                        case 'scale-xy': {
                            this.mode = 'scale';
                            this.raycastPanel = true;
                            switch (this.handler) {
                                case 'scale-yz':
                                    this.axis.copy(_xAxis);
                                    break;
                                case 'scale-xz':
                                    this.axis.copy(_yAxis);
                                    break;
                                case 'scale-xy':
                                    this.axis.copy(_zAxis);
                                    break;
                            }
                            this.axis.applyQuaternion(this.scaleHandlers.quaternion);
                            linePanelIntersection(this.mouse0, mouseRay0, mouseRay1, this.position0, this.axis);
                        }
                            break;
                    }
                    this.position1.copy(this.position0);
                    this.rotation1.copy(this.rotation0);
                    this.scale1.copy(this.scale0);
                }
            }
        } else {
            // update handlers visibilities
            this.translateArrowX.visible = this.handler === 'translate-x';
            this.translateArrowY.visible = this.handler === 'translate-y';
            this.translateArrowZ.visible = this.handler === 'translate-z';
            this.freeTranslateHandler.visible = true;
            this.rotateCircleX.visible = this.handler === 'rotate-x';
            this.rotateCircleY.visible = this.handler === 'rotate-y';
            this.rotateCircleZ.visible = this.handler === 'rotate-z';
            this.scaleCubeX.visible = this.scaleAxisX.visible = this.handler === 'scale-x';
            this.scaleCubeY.visible = this.scaleAxisY.visible = this.handler === 'scale-y';
            this.scaleCubeZ.visible = this.scaleAxisZ.visible = this.handler === 'scale-z';
            this.scalePickerYZ.visible = this.handler === 'scale-yz';
            this.scalePickerXZ.visible = this.handler === 'scale-xz';
            this.scalePickerXY.visible = this.handler === 'scale-xy';
            this.viewRotateCircle.visible = true;
            this.freeRotatePicker.visible = false;

            if (input.mouseLeft) {
                // dragging
                switch (this.mode) {
                    case 'translate': {
                        if (this.handler === 'translate-free') {
                            linePanelIntersection(_mouse1, mouseRay0, mouseRay1, this.position0, mouseRayN);
                        } else {
                            closestPointsBetweenTwoLines(_mouse1, null, this.position0, this.axis, mouseRay0, mouseRayN);
                        }
                        this.detTranslation.subVectors(_mouse1, this.mouse0);
                        if (input.isKeyPressed('Shift')) {
                            snapPoint(this.detTranslation, this.translateSnap);
                        }
                        this.position1.addVectors(this.position0, this.detTranslation);
                        this.position.copy(this.position1);
                        this.updateMatrix();
                    }
                        break;
                    case 'rotate': {
                        switch (this.handler) {
                            case 'rotate-free': {
                                if (!raySphereIntersect(_mouse1, mouseRay0, mouseRay1, this.position0, ROTATE_HANDLER_RADIUS * factor * this.size)) {
                                    linePanelIntersection(_mouse1, mouseRay0, mouseRay1, this.position0, camera._dir);
                                }
                                _v1.subVectors(this.mouse0, this.position0).normalize();
                                _v2.subVectors(_mouse1, this.position0).normalize();
                                _q.setFromUnitVectors(_v1, _v2);
                                this.detRotation.copy(_q);
                                _forward.set(0, 0, 1).applyQuaternion(this.rotation0).applyQuaternion(_q);
                                _up.set(0, 1, 0).applyQuaternion(this.rotation0).applyQuaternion(_q);
                                quatFromForwardUp(this.rotation1, _forward, _up);
                            }
                                break;
                            case 'rotate-view': {
                                linePanelIntersection(_mouse1, mouseRay0, mouseRay1, this.position0, mouseRayN);
                                _v1.subVectors(this.mouse0, this.position0);
                                _v2.subVectors(_mouse1, this.position0);
                                const normal = camera._dir;
                                let angle = angleBetween2VectorsInPanel(normal, _v1, _v2);
                                if (input.isKeyPressed('Shift')) {
                                    angle = Math.round(angle / this.rotateSnap) * this.rotateSnap;
                                }
                                _q.setFromAxisAngle(normal, angle);
                                this.detRotation.copy(_q);
                                this.rotation1.multiplyQuaternions(this.rotation0, _q);
                            }
                                break;
                            default: {
                                switch (this.handler) {
                                    case 'rotate-x':
                                        _axis.set(1, 0, 0);
                                        break;
                                    case 'rotate-y':
                                        _axis.set(0, 1, 0);
                                        break;
                                    case 'rotate-z':
                                        _axis.set(0, 0, 1);
                                        break;
                                }
                                if (this.raycastPanel) {
                                    linePanelIntersection(_mouse1, mouseRay0, mouseRay1, this.position0, mouseRayN);
                                    _v1.subVectors(this.mouse0, this.position0);
                                    _v2.subVectors(_mouse1, this.position0);
                                    let angle = angleBetween2VectorsInPanel(this.axis, _v1, _v2) || 0;
                                    if (input.isKeyPressed('Shift')) {
                                        angle = Math.round(angle / this.rotateSnap) * this.rotateSnap;
                                    }
                                    _q.setFromAxisAngle(_axis, angle);
                                    this.detRotation.copy(_q);
                                    this.rotation1.multiplyQuaternions(this.rotation0, _q);
                                } else {
                                    const radius = ROTATE_HANDLER_RADIUS * factor * this.size;
                                    _dir.crossVectors(this.axis, camera._dir).normalize();
                                    closestPointsBetweenTwoLines(_mouse1, null, this.position0, _dir, mouseRay0, mouseRayN);
                                    const ratio = 0.25;
                                    let angle = _v1.subVectors(_mouse1, this.mouse0).dot(_dir) / radius * Math.PI / 2 * ratio;
                                    if (input.isKeyPressed('Shift')) {
                                        angle = Math.round(angle / this.rotateSnap) * this.rotateSnap;
                                    }
                                    _q.setFromAxisAngle(_axis, angle);
                                    this.detRotation.copy(_q);
                                    this.rotation1.multiplyQuaternions(this.rotation0, _q);
                                }
                            }
                                break;
                        }
                    }
                        break;
                    case 'scale': {
                        if (this.raycastPanel) {
                            linePanelIntersection(_mouse1, mouseRay0, mouseRay1, this.position0, this.axis);
                            let sx = 1;
                            let sy = 1;
                            let sz = 1;
                            _v1.subVectors(this.mouse0, this.position0).negate();
                            _v2.subVectors(_mouse1, this.position0).negate();
                            if (input.isKeyPressed('Shift')) {
                                sx = sy = sz = _v2.length() / _v1.length();
                            } else {
                                _xAxis.set(1, 0, 0).applyQuaternion(this.scaleHandlers.quaternion);
                                _yAxis.set(0, 1, 0).applyQuaternion(this.scaleHandlers.quaternion);
                                _zAxis.set(0, 0, 1).applyQuaternion(this.scaleHandlers.quaternion);
                                sx = _v2.dot(_xAxis) / _v1.dot(_xAxis);
                                sy = _v2.dot(_yAxis) / _v1.dot(_yAxis);
                                sz = _v2.dot(_zAxis) / _v1.dot(_zAxis);
                                if (this.forcePositiveScale) {
                                    sx = Math.abs(sx);
                                    sy = Math.abs(sy);
                                    sz = Math.abs(sz);
                                }
                            }
                            switch (this.handler) {
                                case 'scale-yz':
                                    sx = 1;
                                    break;
                                case 'scale-xz':
                                    sy = 1;
                                    break;
                                case 'scale-xy':
                                    sz = 1;
                                    break;
                            }
                            this.detScale.set(sx, sy, sz);
                            this.scale1.copy(this.scale0).multiply(this.detScale);
                        } else {
                            closestPointsBetweenTwoLines(_mouse1, null, this.position0, this.axis, mouseRay0, mouseRayN);
                            const l0 = -_v1.subVectors(this.mouse0, this.position0).dot(this.axis);
                            const l1 = -_v2.subVectors(_mouse1, this.position0).dot(this.axis);
                            let scale = l1 / l0;
                            if (this.forcePositiveScale) {
                                scale = Math.abs(scale);
                            }
                            if (input.isKeyPressed('Shift')) {
                                this.detScale.setScalar(scale);
                                this.scale1.copy(this.scale0).multiplyScalar(scale);
                            } else {
                                this.scale1.copy(this.scale0);
                                switch (this.handler) {
                                    case 'scale-x':
                                        this.detScale.set(scale, 1, 1);
                                        this.scale1.x *= scale;
                                        break;
                                    case 'scale-y':
                                        this.detScale.set(1, scale, 1);
                                        this.scale1.y *= scale;
                                        break;
                                    case 'scale-z':
                                        this.detScale.set(1, 1, scale);
                                        this.scale1.z *= scale;
                                        break;
                                }
                            }
                        }
                    }
                        break;
                }
            } else {
                // drag end
                this.dragging = false;
                this.mode = undefined;
                this.position0.copy(this.position1);
                this.rotation0.copy(this.rotation1);
                this.scale0.copy(this.scale1);
            }
        }
    }

    private updateOpacity(mesh: Mesh, active: boolean, inactiveOpacity = 0.35, activeOpactity = 1.0) {
        const material = mesh.material as MeshBasicMaterial;
        material.opacity = active ? activeOpactity : inactiveOpacity;
    }
}
