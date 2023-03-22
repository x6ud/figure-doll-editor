import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import {Object3DUserData} from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import CScale from '../model/components/CScale';
import CTemporaryScale from '../model/components/CTemporaryScale';
import CVertices from '../model/components/CVertices';
import ModelNode from '../model/ModelNode';
import EditorTool from './EditorTool';
import icon from './SculptTransform.png';

const _mat = new Matrix4();
const _position = new Vector3();
const _rotation = new Quaternion();
const _scale = new Vector3();

export default class SculptTransformTool extends EditorTool {
    label = 'Sculpt Transform';
    icon = icon;

    private node: ModelNode | null = null;
    private invMat = new Matrix4();

    begin(ctx: EditorContext) {
        // find selected ik node
        this.node = null;
        for (let node of ctx.model.getSelectedNodes()) {
            if (node.type === 'Clay' && !node.instanceId) {
                this.node = node;
                break;
            }
        }
        if (!this.node) {
            for (let view of ctx.views) {
                view.gizmoEnabled = false;
                view.gizmo.visible = false;
                view.gizmo.dragging = false;
            }
            return;
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        if (this.node) {
            view.gizmoEnabled = true;
            view.gizmo.visible = true;
            view.gizmo.orientation = ctx.options.useLocalSpaceForTransformControl ? 'local' : 'world';
            view.gizmo.enableTranslate = true;
            view.gizmo.enableRotate = true;
            view.gizmo.enableScale = true;
            if (!view.gizmo.dragging) {
                view.gizmo.setTargetTransformFromMatrix(this.node.getWorldMatrix());
                this.invMat.copy(this.node.getParentWorldMatrix()).invert();
            }
            view.gizmo.update(
                view.camera,
                view.raycaster,
                view.input,
                view.mouseRay0,
                view.mouseRay1,
                view.mouseRayN
            );
            if (view.gizmo.dragging) {
                _mat.compose(view.gizmo.position1, view.gizmo.rotation1, view.gizmo.scale1);
                _mat.multiplyMatrices(this.invMat, _mat);
                _mat.decompose(_position, _rotation, _scale);
                const node = this.node;
                ctx.history.setValue(node, CPosition, new Vector3().copy(_position));
                ctx.history.setValue(node, CRotation, new Euler().setFromQuaternion(_rotation));
                ctx.model.setValue(node, CTemporaryScale, new Vector3().copy(_scale));
                ctx.throttle(
                    `#${node.id}-apply-transform`,
                    100,
                    () => {
                        if (node.deleted) {
                            return;
                        }
                        _mat.copy(node.getLocalMatrix());
                        const vertices = node.cloneValue(CVertices);
                        const vertex = new Vector3();
                        for (let i = 0, len = vertices.length; i < len; i += 3) {
                            vertex.fromArray(vertices, i);
                            vertex.applyMatrix4(_mat);
                            vertices[i] = vertex.x;
                            vertices[i + 1] = vertex.y;
                            vertices[i + 2] = vertex.z;
                        }
                        ctx.history.setValue(node, CVertices, vertices);
                        ctx.history.setValue(node, CPosition, new Vector3());
                        ctx.history.setValue(node, CRotation, new Euler());
                        ctx.history.setValue(node, CScale, 1);
                        ctx.nextFrameEnd(() => {
                            if (node.deleted) {
                                return;
                            }
                            ctx.model.setValue(node, CTemporaryScale, new Vector3(1, 1, 1));
                        });
                    }
                );
                return;
            }
        }
        // click select
        const input = view.input;
        if (input.pointerOver && input.mouseLeftDownThisFrame) {
            for (let picking of view.mousePick()) {
                const node = (picking.object.userData as Object3DUserData).node;
                if (node && !node.instanceId && node.type === 'Clay') {
                    ctx.model.selected = [node.id];
                    break;
                }
            }
        }
    }

    onUnselected(ctx: EditorContext) {
        for (let view of ctx.views) {
            view.gizmoEnabled = false;
            view.gizmo.visible = false;
            view.gizmo.dragging = false;
        }
        this.node = null;
    }
}
