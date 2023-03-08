import {Box3, Euler, Matrix4, Mesh, Object3D, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CGeom3 from '../model/components/CGeom3';
import CHeight from '../model/components/CHeight';
import CObject3D from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import CRadius from '../model/components/CRadius';
import CRadius3 from '../model/components/CRadius3';
import CRotation from '../model/components/CRotation';
import CScale from '../model/components/CScale';
import CScale3 from '../model/components/CScale3';
import CSign from '../model/components/CSign';
import CSize3 from '../model/components/CSize3';
import ModelNode from '../model/ModelNode';
import AabbEdge from '../utils/geometry/AabbEdge';
import {getScale, getTranslation} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './Gizmo.png';

function getCommonParent(...nodes: Object3D[]): Object3D | null {
    if (!nodes.length) {
        return null;
    }
    if (nodes.length === 1) {
        return nodes[0];
    }
    const parents = new Set<Object3D>();
    let parent: Object3D | null = nodes[0];
    while (parent) {
        parents.add(parent);
        parent = parent.parent;
    }
    let node: Object3D | null = nodes[1];
    while (node) {
        if (parents.has(node)) {
            return getCommonParent(node, ...nodes.slice(2));
        } else {
            node = node.parent;
        }
    }
    return null;
}

const expandBoxByVisibleObjects = (function () {
    const _box = new Box3();
    const _mat = new Matrix4();
    return function expandBoxByVisibleObjects(box: Box3, object: Object3D, invMat: Matrix4) {
        object.updateWorldMatrix(false, false);
        const geometry = (object as Mesh).geometry;
        if (geometry) {
            if (!geometry.boundingBox) {
                geometry.computeBoundingBox();
            }
            _box.copy(geometry.boundingBox!);
            _mat.multiplyMatrices(invMat, object.matrixWorld);
            _box.applyMatrix4(_mat);
            box.union(_box);
        }
        for (let child of object.children) {
            if (child.visible) {
                expandBoxByVisibleObjects(box, child, invMat);
            }
        }
    };
})();

const _box = new Box3();
const _mat = new Matrix4();
const _invMat = new Matrix4();
const _localMat = new Matrix4();
const _position = new Vector3();
const _rotation = new Quaternion();
const _scale = new Vector3();
const _localScale = new Vector3();
const _mat0 = new Matrix4();
const _localMat0 = new Matrix4();
const _scale0 = new Vector3();

export default class GizmoTool extends EditorTool {
    label = 'Transform';
    icon = icon;

    private nodes: ModelNode[] = [];
    private detMats: Map<number, Matrix4> = new Map();
    private geom3Init: Map<number, { [name: string]: any }> = new Map();
    private boundingBox = new AabbEdge();

    setup(ctx: EditorContext) {
        ctx.scene.add(this.boundingBox);
        this.boundingBox.visible = false;
    }

    begin(ctx: EditorContext) {
        const model = ctx.readonlyRef().model;

        // get bounding box for selected objects
        this.nodes = model.getTopmostSelectedNodes().filter(node => node.visible && node.has(CObject3D));
        const objects = this.nodes.map(node => node.value(CObject3D)).filter(object => !!object) as Object3D[];
        if (objects.length) {
            this.boundingBox.visible = true;
            _box.makeEmpty();
            const commonParent = getCommonParent(...objects);
            if (commonParent) {
                commonParent.updateWorldMatrix(false, false);
                _mat.copy(commonParent.matrixWorld);
                _invMat.copy(commonParent.matrixWorld).invert();
            } else {
                _mat.identity();
                _invMat.identity();
            }
            for (let object of objects) {
                expandBoxByVisibleObjects(_box, object, _invMat);
            }
            this.boundingBox.setBox(_box);
            _mat.decompose(
                this.boundingBox.position,
                this.boundingBox.quaternion,
                this.boundingBox.scale
            );
            this.boundingBox.quaternion.normalize();
        } else {
            this.boundingBox.visible = false;
        }

        this.enableSelectionRect = true;
    }

    update(ctx: EditorContext, view: EditorView) {
        // update gizmo
        const gizmo = view.gizmo;
        view.gizmo.visible = true;
        view.gizmoEnabled = this.boundingBox.visible;
        if (view.gizmoEnabled) {
            this.boundingBox.updateMatrixWorld();
            if (!gizmo.dragging) {
                this.boundingBox.box.getCenter(_position).applyMatrix4(this.boundingBox.matrixWorld);
                gizmo.setTargetTransform(_position, this.boundingBox.quaternion, _scale.set(1, 1, 1));
            }
            gizmo.update(
                view.camera,
                view.raycaster,
                view.input,
                view.mouseRay0,
                view.mouseRay1,
                view.mouseRayN
            );
        }

        if (gizmo.dragging) {
            this.enableSelectionRect = false;

            // =========== gizmo dragging start ===========
            // transform
            if (gizmo.dragStart) {
                // compute inverse matrix of selected object
                _mat.compose(gizmo.position0, gizmo.rotation0, gizmo.scale0);
                _invMat.copy(_mat).invert();
                // save dragging start state
                this.detMats.clear();
                this.geom3Init.clear();
                for (let node of this.nodes) {
                    // save inverse matrix, related to the common parent
                    const mat = new Matrix4().multiplyMatrices(_invMat, node.getWorldMatrix());
                    this.detMats.set(node.id, mat);
                    // save geom3 size
                    switch (node.type) {
                        case 'CsgCuboid':
                            this.geom3Init.set(node.id, {
                                [CSize3.name]: node.cloneValue(CSize3),
                                [CScale3.name]: node.cloneValue(CScale3),
                            });
                            break;
                        case 'CsgEllipsoid':
                            this.geom3Init.set(node.id, {
                                [CRadius3.name]: node.cloneValue(CRadius3),
                                [CScale3.name]: node.cloneValue(CScale3),
                            });
                            break;
                        case 'CsgCylinder':
                            this.geom3Init.set(node.id, {
                                [CHeight.name]: node.cloneValue(CHeight),
                                [CScale3.name]: node.cloneValue(CScale3),
                                [CRadius.name]: node.cloneValue(CRadius),
                            });
                            break;
                        case 'CsgCylinderElliptic':
                            this.geom3Init.set(node.id, {
                                [CHeight.name]: node.cloneValue(CHeight),
                                [CScale3.name]: node.cloneValue(CScale3),
                            });
                            break;
                    }
                }
            } else {
                _mat0.compose(gizmo.position0, gizmo.rotation0, gizmo.scale0);
                _mat.compose(gizmo.position1, gizmo.rotation1, gizmo.scale1);
                for (let node of this.nodes) {
                    // compute new local matrix
                    const detMat = this.detMats.get(node.id);
                    if (!detMat) {
                        continue;
                    }
                    _localMat.copy(node.getParentWorldMatrix()).invert().multiply(_mat).multiply(detMat);
                    _localMat.decompose(_position, _rotation, _scale);

                    // apply translation
                    if (node.has(CPosition)) {
                        ctx.history.setValue(node, CPosition, new Vector3().copy(_position));
                    }

                    // apply rotation
                    if (node.has(CRotation)) {
                        ctx.history.setValue(node, CRotation, new Euler().setFromQuaternion(_rotation));
                    }

                    // for csg nodes: resize geometry, rather than changing the scale
                    let resizeGeom3 = false;
                    if (gizmo.mode === 'scale') {
                        const props = this.geom3Init.get(node.id);
                        if (props
                            && Math.abs(_rotation.length() - 1) < 1e-8 // disable geom3 resizing the matrix contains a shear
                        ) {
                            const scale0 = props[CScale3.name] as Vector3;
                            _localScale.copy(_scale).divide(scale0);
                            switch (node.type) {
                                case 'CsgCuboid': {
                                    const value = new Vector3().copy(props[CSize3.name]);
                                    value.multiply(_localScale);
                                    ctx.history.setValue(node, CSize3, value);
                                    resizeGeom3 = true;
                                }
                                    break;
                                case 'CsgEllipsoid': {
                                    const value = new Vector3().copy(props[CRadius3.name]);
                                    value.multiply(_localScale);
                                    ctx.history.setValue(node, CRadius3, value);
                                    resizeGeom3 = true;
                                }
                                    break;
                                case 'CsgCylinder': {
                                    if (Math.abs(_localScale.x - 1) < 1e-7
                                        && Math.abs(_localScale.y - 1) < 1e-7
                                        && Math.abs(_localScale.z - 1) > 1e-7
                                    ) {
                                        let value = props[CHeight.name] as number;
                                        value *= _localScale.z;
                                        ctx.history.setValue(node, CHeight, value);
                                        ctx.history.setValue(node, CScale3, new Vector3().copy(scale0));
                                        resizeGeom3 = true;
                                    } else if (
                                        Math.abs(_localScale.x - 1) > 1e-7
                                        && Math.abs(_localScale.y - _localScale.x) < 1e-7
                                        && Math.abs(_localScale.z - 1) < 1e-7
                                    ) {
                                        let value = props[CRadius.name] as number;
                                        value *= _localScale.x;
                                        ctx.history.setValue(node, CRadius, value);
                                        ctx.history.setValue(node, CScale3, new Vector3().copy(scale0));
                                        resizeGeom3 = true;
                                    } else {
                                        ctx.history.setValue(node, CHeight, props[CHeight.name] as number);
                                        ctx.history.setValue(node, CRadius, props[CRadius.name] as number);
                                    }
                                }
                                    break;
                                case 'CsgCylinderElliptic': {
                                    if (Math.abs(_localScale.x - 1) < 1e-7
                                        && Math.abs(_localScale.y - 1) < 1e-7
                                        && Math.abs(_localScale.z - 1) > 1e-7
                                    ) {
                                        let value = props[CHeight.name] as number;
                                        value *= _localScale.z;
                                        ctx.history.setValue(node, CHeight, value);
                                        ctx.history.setValue(node, CScale3, new Vector3().copy(scale0));
                                        resizeGeom3 = true;
                                    } else {
                                        ctx.history.setValue(node, CHeight, props[CHeight.name] as number);
                                    }
                                }
                                    break;
                            }
                        }
                    }

                    // apply scale
                    if (!resizeGeom3) {
                        if (node.has(CScale)) {
                            _localMat0.copy(node.getParentWorldMatrix()).invert().multiply(_mat0).multiply(detMat);
                            getScale(_scale0, _localMat0);
                            const val = (_scale.x / _scale0.x || 1) * (_scale.y / _scale0.y || 1) * (_scale.z / _scale0.z || 1) * _scale0.x;
                            ctx.history.setValue(node, CScale, val);
                        } else if (node.has(CScale3)) {
                            ctx.history.setValue(node, CScale3, new Vector3().copy(_scale));
                        }
                    }

                    if (node.has(CGeom3)) {
                        // show placeholder for resizing
                        const cGeom3 = node.get(CGeom3);
                        if (resizeGeom3) {
                            cGeom3.useTempMat = true;
                            cGeom3.tempMat.copy(_localMat);
                        } else {
                            cGeom3.useTempMat = false;
                        }

                        // avoid geometry update causing ui to freeze
                        let csgRoot = node;
                        while (csgRoot) {
                            if (csgRoot.parent && csgRoot.parent.has(CGeom3)) {
                                csgRoot = csgRoot.parent;
                            } else {
                                break;
                            }
                        }
                        ctx.delayThrottle(`#${csgRoot.id}-update-csg`, 50);
                    }
                }
            }
            // =========== gizmo dragging end ===========
        } else {
            // =========== selecting start ===========
            if (ctx.selectionRectSetThisFrame && ctx.selectionRectViewIndex === view.index) {
                const selectionRect = ctx.readonlyRef().selectionRect;
                if (Math.abs(selectionRect.x0 - selectionRect.x1) < 1e-6
                    && Math.abs(selectionRect.y0 - selectionRect.y1) < 1e-6
                ) {
                    // point select
                    // raycast
                    const results = view.raycaster.intersectObjects(
                        ctx.readonlyRef().scene.children.filter(object => !!object.userData.node)
                    );
                    let clickedOnSelected = false;
                    let topClickedNode: ModelNode | null = null;
                    for (let result of results) {
                        if (result.object.userData.node?.visible) {
                            const node = result.object.userData.node as ModelNode;
                            if (!topClickedNode) {
                                topClickedNode = node;
                            }
                            if (!clickedOnSelected && ctx.model.selected.includes(node.id)) {
                                clickedOnSelected = true;
                                break;
                            }
                        }
                    }
                    // bezier control points
                    const controlPoints = new Set<ModelNode>();
                    for (let node of this.nodes) {
                        if (node.type === 'CsgBezierControlPoint') {
                            for (let child of node.parent!.children) {
                                controlPoints.add(child);
                            }
                        }
                    }
                    let topZ = Infinity;
                    const camera = view.camera.get();
                    for (let node of controlPoints) {
                        getTranslation(_position, node.getWorldMatrix());
                        _position.project(camera);
                        if (_position.z > topZ) {
                            continue;
                        }
                        _position.x += 1;
                        _position.y += 1;
                        _position.x *= view.width / 2;
                        _position.y *= view.height / 2;
                        if (Math.sqrt((view.mouseScr.x - _position.x) ** 2 + (view.mouseScr.y - _position.y) ** 2) <= 24 / 2) {
                            topZ = _position.z;
                            topClickedNode = node;
                        }
                    }
                    // add selection
                    if (!clickedOnSelected) {
                        if (!view.input.isKeyPressed('Control')) {
                            ctx.model.selected.length = 0;
                        }
                        if (topClickedNode) {
                            ctx.model.addSelection(topClickedNode.id);
                        }
                    }
                } else {
                    // range select
                    const controlPoints = new Set<ModelNode>();
                    for (let node of this.nodes) {
                        if (node.type === 'CsgBezierControlPoint') {
                            for (let child of node.parent!.children) {
                                controlPoints.add(child);
                            }
                        }
                    }
                    if (controlPoints.size) {
                        const camera = view.camera.get();
                        if (!view.input.isKeyPressed('Control')) {
                            ctx.model.selected.length = 0;
                        }
                        const x0 = Math.min(selectionRect.x0, selectionRect.x1);
                        const y0 = Math.min(selectionRect.y0, selectionRect.y1);
                        const x1 = Math.max(selectionRect.x0, selectionRect.x1);
                        const y1 = Math.max(selectionRect.y0, selectionRect.y1);
                        for (let node of controlPoints) {
                            getTranslation(_position, node.getWorldMatrix());
                            _position.project(camera);
                            if (_position.x >= x0
                                && _position.x <= x1
                                && _position.y >= y0
                                && _position.y <= y1
                            ) {
                                ctx.model.selected.push(node.id);
                            }
                        }
                    } else {
                        const result = selectionRect.select(
                            view.camera.get(),
                            ctx.readonlyRef().scene.children.filter(object => !!object.userData.node)
                        );
                        if (!view.input.isKeyPressed('Control')) {
                            ctx.model.selected.length = 0;
                        }
                        for (let obj of result) {
                            if (obj.userData.node?.visible) {
                                ctx.model.addSelection(obj.userData.node.id);
                            }
                        }
                    }
                }
            }
            // =========== selecting end ===========
        }
    }

    end(ctx: EditorContext) {
        // show placeholders
        const nodes = new Set<ModelNode>();
        for (let node of this.nodes) {
            if (node.type === 'CsgBezierControlPoint') {
                for (let child of node.parent!.children) {
                    nodes.add(child);
                }
            } else {
                if (!node.has(CGeom3)) {
                    continue;
                }
                const cGeom3 = node.get(CGeom3);
                let parent: ModelNode | null = node;
                let showPlaceholder = false;
                if (cGeom3.useTempMat) {
                    showPlaceholder = true;
                } else {
                    while (parent) {
                        if (!parent.has(CGeom3)) {
                            break;
                        }
                        if (parent.has(CSign) && parent?.parent?.has(CGeom3)) {
                            if (parent.value(CSign) === 'negative') {
                                showPlaceholder = true;
                                break;
                            }
                        }
                        parent = parent.parent;
                    }
                }
                if (showPlaceholder) {
                    nodes.add(node);
                }
            }
        }
        for (let node of nodes) {
            const cObject3D = node.get(CObject3D);
            if (!cObject3D.value) {
                continue;
            }
            const cGeom3 = node.get(CGeom3);
            const placeholder = cGeom3.placeholder;
            if (placeholder) {
                if (!placeholder.parent) {
                    ctx.scene.add(placeholder);
                }
                placeholder.visible = true;
                placeholder.matrixAutoUpdate = false;
                if (cGeom3.useTempMat) {
                    placeholder.matrix.multiplyMatrices(node.getParentWorldMatrix(), cGeom3.tempMat);
                } else {
                    placeholder.matrix.copy(cObject3D.value.matrixWorld);
                }
            }
        }
    }

    afterRender(ctx: EditorContext) {
        // hide placeholders
        for (let node of this.nodes) {
            if (node.type === 'CsgBezierControlPoint') {
                for (let child of node.parent!.children) {
                    const cGeom3 = child.get(CGeom3);
                    if (cGeom3.placeholder) {
                        cGeom3.placeholder.visible = false;
                    }
                }
            } else {
                if (node.has(CGeom3)) {
                    const cGeom3 = node.get(CGeom3);
                    if (cGeom3.placeholder) {
                        cGeom3.placeholder.visible = false;
                    }
                }
            }
        }
    }

    onUnselected(ctx: EditorContext) {
        this.boundingBox.visible = false;
        for (let view of ctx.views) {
            view.gizmoEnabled = false;
            view.gizmo.visible = false;
        }
        ctx.selectionRect.hide();
        this.nodes = [];
        this.detMats.clear();
        this.geom3Init.clear();
    }
}
