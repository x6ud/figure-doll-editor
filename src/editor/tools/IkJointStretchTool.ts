import {Matrix4, Vector3} from 'three';
import Class from '../../common/type/Class';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CIkNode from '../model/components/CIkNode';
import CIkNodeLength from '../model/components/CIkNodeLength';
import {Object3DUserData} from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import CTemporaryScale from '../model/components/CTemporaryScale';
import CVertices from '../model/components/CVertices';
import ModelNode from '../model/ModelNode';
import ModelNodeComponent from '../model/ModelNodeComponent';
import EditorTool from './EditorTool';
import icon from './IkJointStretch.png';

const _point = new Vector3();
const _invMat = new Matrix4();

export default class IkJointStretchTool extends EditorTool {
    label = 'Stretch Joint';
    icon = icon;

    /** Selected IKNode */
    private node: ModelNode | null = null;
    private dragging = false;
    private draggedPrevFrame = false;
    /** Dragging start ik node length */
    private length0 = 0;
    /** Dragging start ik node children positions */
    private childrenPosition0 = new Map<number, Vector3>();
    /** Scale to be applied */
    private scale = new Vector3();

    begin(ctx: EditorContext) {
        this.cleanup(ctx);

        // find selected ik node
        this.node = null;
        for (let node of ctx.model.getSelectedNodes()) {
            if (!node.instanceId) {
                this.node = node;
                break;
            }
        }
        while (this.node) {
            if (this.node.type === 'IKNode' && !this.node.instanceId) {
                break;
            }
            this.node = this.node.parent;
        }
        if (!this.node) {
            return;
        }

        // show ik bone
        const chain = this.node.parent!;
        for (let i = 0, len = chain.children.length; i < len; ++i) {
            const node = chain.children[i];
            const cIkNode = node.get(CIkNode);
            if (cIkNode.boneMesh) {
                cIkNode.boneMesh.visible = true;
            }
        }

        if (!this.dragging) {
            this.length0 = this.node.value(CIkNodeLength);
            this.childrenPosition0.clear();
            for (let child of this.node.children) {
                if (child.has(CPosition)) {
                    this.childrenPosition0.set(child.id, new Vector3().copy(child.value(CPosition)));
                }
            }
        }
        this.draggedPrevFrame = this.dragging;
        this.dragging = false;
    }

    update(ctx: EditorContext, view: EditorView): void {
        // gizmo
        if (this.node) {
            view.gizmoEnabled = true;
            view.gizmo.visible = true;
            view.gizmo.orientation = 'local';
            view.gizmo.enableTranslate = false;
            view.gizmo.enableRotate = false;
            view.gizmo.enableScale = true;
            if (!view.gizmo.dragging) {
                view.gizmo.setTargetTransformFromMatrix(this.node.getWorldMatrix());
                view.gizmo.scale0.set(1, 1, 1);
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
                this.dragging = true;
                this.scale.copy(view.gizmo.scale1);
                this.scale.x = Math.max(this.scale.x, 0);
                ctx.history.setValue(this.node, CIkNodeLength, this.length0 * this.scale.x);
                for (let pair of this.childrenPosition0) {
                    const node = ctx.model.getNode(pair[0]);
                    const position0 = pair[1];
                    const position = new Vector3().copy(position0);
                    position.x *= this.scale.x;
                    ctx.history.setValue(node, CPosition, position);
                }
                for (let child of this.node.children) {
                    if (child.type === 'Clay') {
                        ctx.model.setValue(child, CTemporaryScale, new Vector3().copy(this.scale));
                    }
                }
                return;
            }
        }
        // click select
        const input = view.input;
        if (input.pointerOver && input.mouseLeftDownThisFrame) {
            for (let picking of view.mousePick()) {
                const node = (picking.object.userData as Object3DUserData).node;
                if (node && !node.instanceId) {
                    ctx.model.selected = [node.id];
                    break;
                }
            }
        }
    }

    end(ctx: EditorContext) {
        // apply transform for child clay nodes
        if (this.draggedPrevFrame && !this.dragging && this.node) {
            const scale = this.scale;
            const x0 = this.length0;
            const x1 = scale.x * x0;
            const dx = x1 - x0;
            const keepCap = ctx.options.keepBothEndsOfClayNodesWhenStretching;
            let changed = false;
            for (let child of this.node.children) {
                if (child.type === 'Clay') {
                    changed = true;
                    const mat = child.getLocalMatrix();
                    _invMat.copy(mat).invert();
                    const vertices = child.cloneValue(CVertices);
                    for (let i = 0, len = vertices.length; i < len; i += 3) {
                        _point.fromArray(vertices, i);
                        _point.applyMatrix4(mat);
                        if (scale.x > 1 && keepCap) {
                            if (_point.x > 0 && _point.x < x1) {
                                _point.x *= scale.x;
                            } else if (_point.x >= x1) {
                                _point.x += dx;
                            }
                        } else {
                            _point.x *= scale.x;
                        }
                        _point.y *= scale.y;
                        _point.z *= scale.z;
                        _point.applyMatrix4(_invMat);
                        vertices[i] = _point.x;
                        vertices[i + 1] = _point.y;
                        vertices[i + 2] = _point.z;
                    }
                    ctx.history.setValue(child, CVertices, vertices);

                }
            }
            if (changed) {
                const targetRecord: { node: ModelNode, componentClass: Class<ModelNodeComponent<any>>, hashName?: string }[] = [];
                targetRecord.push({node: this.node, componentClass: CIkNodeLength});
                for (let pair of this.childrenPosition0) {
                    const node = ctx.model.getNode(pair[0]);
                    targetRecord.push({node, componentClass: CPosition});
                }
                ctx.history.mergeLastRecord(targetRecord);
            }
        }
    }

    onUnselected(ctx: EditorContext) {
        for (let view of ctx.views) {
            view.gizmoEnabled = false;
            view.gizmo.visible = false;
            view.gizmo.dragging = false;
        }
        this.cleanup(ctx);
        this.node = null;
        this.dragging = false;
        this.draggedPrevFrame = false;
        this.scale.setScalar(1);
        this.childrenPosition0.clear();
    }

    private cleanup(ctx: EditorContext) {
        if (this.node) {
            for (let child of this.node.children) {
                if (child.type === 'Clay') {
                    ctx.model.setValue(child, CTemporaryScale, new Vector3(1, 1, 1));
                }
            }
            const chain = this.node.parent!;
            for (let i = 0, len = chain.children.length; i < len; ++i) {
                const node = chain.children[i];
                const cIkNode = node.get(CIkNode);
                cIkNode.resetHandlers(ctx);
            }
        }
    }
}
