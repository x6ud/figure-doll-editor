import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CBoxSize from '../model/components/CBoxSize';
import {Object3DUserData} from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import ModelNode from '../model/ModelNode';
import BoxEdge from '../utils/geometry/BoxEdge';
import BoxFace from '../utils/geometry/BoxFace';
import {
    closestPointsBetweenTwoLines,
    getScaleScalar,
    linePanelIntersection,
    quatFromForwardUp,
    snapPoint
} from '../utils/math';
import icon from './Box.png';
import EditorTool from './EditorTool';

const _mouse1 = new Vector3();
const _local1 = new Vector3();
const _det = new Vector3();
const _position = new Vector3();
const _boxSize = new Vector3();
const _range0 = new Vector3();
const _range1 = new Vector3();
const _cross = new Vector3();
const _normal = new Vector3();
const _invMat = new Matrix4();
const _local2 = new Vector3();
const _local3 = new Vector3();
const _nx = new Vector3();
const _ny = new Vector3();
const _nz = new Vector3();

const SNAP = 0.25;

export default class BoxTool extends EditorTool {
    label = 'Box';
    icon = icon;
    tips = 'Hold [Alt] to create a box';

    private boxEdge = new BoxEdge();
    private boxFace = new BoxFace();

    private activeViewIndex = -1;

    private draggingFace = false;
    private draggingFaceNodeId = 0;
    private draggingFaceIndex = 0;
    private draggingFaceNormal = new Vector3();
    private faceNormalWorld0 = new Vector3();
    private position0 = new Vector3();
    private boxSize0 = new Vector3();
    private localMat0 = new Matrix4();
    private invWorldMat0 = new Matrix4();
    private mouse0 = new Vector3();
    private local0 = new Vector3();

    private creating = false;
    private point2Set = false;
    private point1 = new Vector3();
    private point2 = new Vector3();
    private normal1 = new Vector3();
    private normal2 = new Vector3();
    private boxHeight = 0;

    setup(ctx: EditorContext) {
        this.boxEdge.visible = false;
        ctx.scene.add(this.boxEdge);
        this.boxFace.visible = false;
        ctx.scene.add(this.boxFace);
    }

    begin(ctx: EditorContext) {
        if (!this.draggingFace) {
            this.boxFace.visible = false;
        }
        if (!this.creating) {
            this.boxEdge.visible = false;
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;

        // dragging box face
        if (this.draggingFace) {
            if (this.activeViewIndex !== view.index) {
                return;
            }
            if (input.pointerOver && input.mouseLeft && ctx.model.isNodeExists(this.draggingFaceNodeId, 'Box')) {
                if (_cross.crossVectors(this.faceNormalWorld0, view.mouseRayN).lengthSq() < 1e-6) {
                    return;
                }
                closestPointsBetweenTwoLines(
                    _mouse1, null,
                    this.mouse0, this.faceNormalWorld0,
                    view.mouseRay0, view.mouseRayN
                );
                _local1.copy(_mouse1).applyMatrix4(this.invWorldMat0);
                const det = _det.subVectors(_local1, this.local0).dot(this.draggingFaceNormal);
                _position.copy(this.position0);
                _boxSize.copy(this.boxSize0);
                const node = ctx.model.getNode(this.draggingFaceNodeId);
                switch (this.draggingFaceIndex) {
                    case BoxFace.Left:
                    case BoxFace.Right: {
                        _boxSize.x = Math.max(0, det + _boxSize.x);
                        if (input.isKeyPressed('Shift')) {
                            _boxSize.x = Math.round(_boxSize.x / SNAP) * SNAP;
                        }
                        const sign = this.draggingFaceIndex === BoxFace.Left ? 1 : -1;
                        _range0.set(sign * this.boxSize0.x / 2, 0, 0);
                        _range1.set(sign * _boxSize.x / 2, 0, 0);
                    }
                        break;
                    case BoxFace.Bottom:
                    case BoxFace.Top: {
                        _boxSize.y = Math.max(0, det + _boxSize.y);
                        if (input.isKeyPressed('Shift')) {
                            _boxSize.y = Math.round(_boxSize.y / SNAP) * SNAP;
                        }
                        const sign = this.draggingFaceIndex === BoxFace.Bottom ? 1 : -1;
                        _range0.set(0, sign * this.boxSize0.y / 2, 0);
                        _range1.set(0, sign * _boxSize.y / 2, 0);
                    }
                        break;
                    case BoxFace.Back:
                    case BoxFace.Front: {
                        _boxSize.z = Math.max(0, det + _boxSize.z);
                        if (input.isKeyPressed('Shift')) {
                            _boxSize.z = Math.round(_boxSize.z / SNAP) * SNAP;
                        }
                        const sign = this.draggingFaceIndex === BoxFace.Back ? 1 : -1;
                        _range0.set(0, 0, sign * this.boxSize0.z / 2);
                        _range1.set(0, 0, sign * _boxSize.z / 2);
                    }
                        break;
                }
                _range0.applyMatrix4(this.localMat0);
                _range1.applyMatrix4(this.localMat0);
                _position.add(_range0).sub(_range1);
                ctx.history.setValue(node, CBoxSize, new Vector3().copy(_boxSize));
                ctx.history.setValue(node, CPosition, new Vector3().copy(_position));
                _boxSize.multiplyScalar(getScaleScalar(node.getWorldMatrix()));
                ctx.statusBarMessage = `${_boxSize.x.toFixed(2)} × ${_boxSize.y.toFixed(2)} × ${_boxSize.z.toFixed(2)}`;
            } else {
                this.draggingFace = false;
                this.activeViewIndex = -1;
                this.draggingFaceNodeId = 0;
                ctx.statusBarMessage = this.tips;
            }
            return;
        }

        // creating box
        if (this.creating) {
            // set point 2
            if (!this.point2Set) {
                if (this.activeViewIndex !== view.index) {
                    return;
                }
                if (input.mouseRightDownThisFrame) {
                    // cancel
                    this.creating = false;
                    ctx.statusBarMessage = this.tips;
                }
                if (linePanelIntersection(
                    this.point2,
                    view.mouseRay0, view.mouseRay1,
                    this.point1, this.normal2
                )) {
                    this.boxEdge.setPoint2(this.point2);
                    this.boxEdge.updateGeometry();
                    if (input.isKeyPressed('Shift')) {
                        _nx.copy(this.normal1);
                        _ny.crossVectors(this.normal1, this.normal2).normalize();
                        let w = this.boxEdge.getWidth();
                        let l = this.boxEdge.getLength();
                        w = Math.round(w / SNAP) * SNAP;
                        l = Math.round(l / SNAP) * SNAP;
                        this.point2.copy(this.point1)
                            .addScaledVector(_nx, w)
                            .addScaledVector(_ny, l);
                        this.boxEdge.setPoint2(this.point2);
                        this.boxEdge.updateGeometry();
                    }
                    const w = Math.abs(this.boxEdge.getWidth()).toFixed(2);
                    const l = Math.abs(this.boxEdge.getLength()).toFixed(2);
                    ctx.statusBarMessage = `${w} × ${l}`;
                }
                if (!input.mouseLeft) {
                    this.point2Set = true;
                }
                return;
            }
            if (!input.pointerOver) {
                return;
            }

            if (input.mouseRightDownThisFrame) {
                // cancel
                this.creating = false;
                this.point2Set = false;
                ctx.statusBarMessage = this.tips;
            }

            // set height
            if (_cross.crossVectors(this.normal2, view.mouseRayN).lengthSq() < 1e-8) {
                return;
            }
            if (!closestPointsBetweenTwoLines(
                _mouse1, null,
                this.point2, this.normal2,
                view.mouseRay0, view.mouseRayN
            )) {
                this.boxHeight = _det.subVectors(_mouse1, this.point2).dot(this.normal2);
                if (input.isKeyPressed('Shift')) {
                    this.boxHeight = Math.round(this.boxHeight / SNAP) * SNAP;
                }
                this.boxEdge.setHeight(this.boxHeight);
                this.boxEdge.updateGeometry();
                const w = Math.abs(this.boxEdge.getWidth()).toFixed(2);
                const l = Math.abs(this.boxEdge.getLength()).toFixed(2);
                const h = Math.abs(this.boxHeight).toFixed(2);
                ctx.statusBarMessage = `${w} × ${l} × ${h}`;
            }

            // create node
            if (input.mouseLeftDownThisFrame) {
                this.creating = false;
                this.point2Set = false;
                ctx.statusBarMessage = this.tips;

                let parent: ModelNode | null = null;
                for (let node of ctx.model.getSelectedNodes()) {
                    if (node.isValidChild('Box')) {
                        parent = node;
                        break;
                    }
                }
                if (parent) {
                    _invMat.copy(parent.getWorldMatrix()).invert();
                } else {
                    _invMat.identity();
                }
                _local1.copy(this.point1).applyMatrix4(_invMat);
                _local2.copy(this.point2).applyMatrix4(_invMat);
                _local3.copy(this.point2).addScaledVector(this.normal2, this.boxHeight).applyMatrix4(_invMat);
                _nx.copy(this.normal1).transformDirection(_invMat);
                _ny.copy(this.normal2).transformDirection(_invMat);
                _nz.crossVectors(_nx, _ny).normalize();
                let x0 = _local1.dot(_nx);
                let x1 = _local2.dot(_nx);
                if (x0 > x1) {
                    [x0, x1] = [x1, x0];
                }
                let z0 = _local1.dot(_nz);
                let z1 = _local2.dot(_nz);
                if (z0 > z1) {
                    [z0, z1] = [z1, z0];
                }
                let y0 = _local2.dot(_ny);
                let y1 = _local3.dot(_ny);
                if (y0 > y1) {
                    [y0, y1] = [y1, y0];
                }
                const rot = new Euler().setFromQuaternion(quatFromForwardUp(new Quaternion(), _nz, _ny));
                const size = new Vector3(x1 - x0, y1 - y0, z1 - z0);
                const pos = new Vector3()
                    .addScaledVector(_nx, x0 + size.x / 2)
                    .addScaledVector(_ny, y0 + size.y / 2)
                    .addScaledVector(_nz, z0 + size.z / 2);
                ctx.history.createNode({
                    type: 'Box',
                    parentId: parent ? parent.id : 0,
                    data: {
                        [CBoxSize.name]: size,
                        [CPosition.name]: pos,
                        [CRotation.name]: rot
                    }
                });
            }
            return;
        }

        if (input.pointerOver) {
            // find hovered box face
            for (let result of view.mousePick()) {
                const node = (result.object.userData as Object3DUserData).node;
                if (node?.type === 'Box') {
                    const normal = result.face?.normal;
                    if (normal) {
                        this.boxFace.visible = true;
                        this.boxFace.matrixAutoUpdate = false;
                        this.boxFace.matrix.copy(node.getWorldMatrix());
                        this.boxFace.setSize(node.value(CBoxSize));
                        this.boxFace.setFaceFromNormal(normal);
                        this.boxFace.updateGeometry();

                        this.point1.copy(result.point);

                        // drag start
                        if (input.mouseLeftDownThisFrame && !input.isKeyPressed('Alt')) {
                            this.draggingFace = true;
                            this.activeViewIndex = view.index;
                            this.draggingFaceNodeId = node.id;
                            this.draggingFaceIndex = this.boxFace.getFace();
                            this.draggingFaceNormal.copy(normal);
                            this.faceNormalWorld0.copy(normal).transformDirection(node.getWorldMatrix());
                            this.position0.copy(node.value(CPosition));
                            this.boxSize0.copy(node.value(CBoxSize));
                            this.localMat0.copy(node.getLocalMatrix());
                            this.invWorldMat0.copy(node.getWorldMatrix()).invert();
                            this.mouse0.copy(result.point);
                            this.local0.copy(this.mouse0).applyMatrix4(this.invWorldMat0);
                        }
                    }
                    break;
                }
            }

            // create box
            if (input.isKeyPressed('Alt') && input.mouseLeftDownThisFrame) {
                if (this.boxFace.visible) {
                    this.creating = true;
                    this.boxFace.getFaceTangent(this.normal1);
                    this.boxFace.getFaceNormal(this.normal2);
                    this.normal1.transformDirection(this.boxFace.matrix);
                    this.normal2.transformDirection(this.boxFace.matrix);
                } else {
                    if (linePanelIntersection(
                        this.point1,
                        view.mouseRay0, view.mouseRay1,
                        this.point1.set(0, 0, 0),
                        view.camera.perspective ? _normal.set(0, 1, 0) : view.mouseRayN
                    )) {
                        if (view.camera.perspective) {
                            this.normal1.set(1, 0, 0);
                            this.normal2.set(0, 1, 0);
                        } else {
                            this.boxFace.setFaceFromNormal(view.mouseRayN);
                            this.boxFace.getFaceTangent(this.normal1);
                            this.boxFace.getFaceNormal(this.normal2);
                        }
                        this.creating = true;
                    }
                }
                // set point 1
                if (this.creating) {
                    if (input.isKeyPressed('Shift')) {
                        snapPoint(this.point1, SNAP);
                    }
                    this.activeViewIndex = view.index;
                    this.boxHeight = 0;
                    this.boxEdge.setPoint1(this.point1);
                    this.boxEdge.setPoint2(this.point1);
                    this.boxEdge.setNormal1(this.normal1);
                    this.boxEdge.setNormal2(this.normal2);
                    this.boxEdge.setHeight(0);
                    this.boxEdge.updateGeometry();
                    this.boxEdge.visible = true;
                }
            }
        }
    }

    onUnselected(ctx: EditorContext) {
        this.draggingFace = false;
        this.creating = false;
        this.point2Set = false;
        this.boxEdge.visible = false;
        this.boxFace.visible = false;
    }
}
