import {Matrix4, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CBoxSize from '../model/components/CBoxSize';
import {Object3DUserData} from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import BoxEdge from '../utils/geometry/BoxEdge';
import BoxFace from '../utils/geometry/BoxFace';
import {closestPointsBetweenTwoLines} from '../utils/math';
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

const SNAP = 0.25;

export default class BoxTool extends EditorTool {
    label = 'Box';
    icon = icon;
    tips = 'Hold [Alt] to create a box';

    private boxEdge = new BoxEdge();
    private boxFace = new BoxFace();

    private draggingFace = false;
    private draggingFaceViewIndex = -1;
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

    setup(ctx: EditorContext) {
        this.boxEdge.visible = false;
        ctx.scene.add(this.boxEdge);
        this.boxFace.visible = false;
        ctx.scene.add(this.boxFace);
    }

    begin(ctx: EditorContext) {
        this.boxEdge.visible = false;
        if (!this.draggingFace) {
            this.boxFace.visible = false;
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;

        if (this.draggingFace && this.draggingFaceViewIndex === view.index) {
            // dragging box face
            if (input.mouseOver && input.mouseLeft && ctx.model.isNodeExists(this.draggingFaceNodeId, 'Box')) {
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
            } else {
                this.draggingFace = false;
                this.draggingFaceViewIndex = -1;
                this.draggingFaceNodeId = 0;
            }
            return;
        }

        if (input.mouseOver) {
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
                        // drag start
                        if (input.mouseLeftDownThisFrame) {
                            this.draggingFace = true;
                            this.draggingFaceViewIndex = view.index;
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
                            ctx.model.selected = [node.id];
                        }
                    }
                    break;
                }
            }
        }
    }
}
