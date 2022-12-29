import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CIkNode from '../model/components/CIkNode';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import {Object3DUserData} from '../model/components/CObject3D';
import ModelNode from '../model/ModelNode';
import {angleBetween2VectorsInPanel, closestPointOnLine, linePanelIntersection, quatFromForwardUp} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './IkRotate.png';

const _mouse1 = new Vector3();
const _local0 = new Vector3();
const _local1 = new Vector3();
const _det = new Vector3();
const _v0 = new Vector3();
const _v1 = new Vector3();
const _rotation = new Quaternion();
const _detRot = new Quaternion();
const _forward = new Vector3();
const _up = new Vector3();
const _dir = new Vector3();
const _o = new Vector3();
const _invQuat = new Quaternion();

export default class IkRotateTool extends EditorTool {
    label = 'Rotate Bone';
    icon = icon;

    private activeView = -1;
    /** Selected ik chain nodes */
    private ikChains: ModelNode[] = [];
    /** Ik node being dragged */
    private node?: ModelNode;
    /** Swing or twist */
    private swing: boolean = false;
    /** Dragging start mouse position in world space */
    private mouse0 = new Vector3();
    /** Rotation center in world space */
    private origin = new Vector3();
    /** Dragged bone's direction in world space */
    private boneAxis = new Vector3();
    /** Dragged ik chain's inverse world matrix */
    private invMat = new Matrix4();
    /** Dragged node's start position in ik chain's local space */
    private nodeStart0 = new Vector3();
    /** Dragged node's end position in ik chain's local space */
    private nodeEnd0 = new Vector3();
    /** Dragged node's rotation in ik chain's local space */
    private rotation0 = new Quaternion();

    begin(ctx: EditorContext) {
        this.cleanup(ctx);
        // list selected ik chains
        const chains = new Set<ModelNode>();
        for (let node of ctx.model.getSelectedNodes()) {
            if (node.type === 'IKChain') {
                chains.add(node);
            } else if (node.type === 'IKNode') {
                node.parent && chains.add(node.parent);
            }
        }
        this.ikChains = Array.from(chains);
        // show ik nodes handlers
        for (let chain of this.ikChains) {
            for (let i = 0, len = chain.children.length; i < len; ++i) {
                const node = chain.children[i];
                const cIkNode = node.get(CIkNode);
                if (cIkNode.boneMesh) {
                    cIkNode.boneMesh.visible = true;
                }
                if (cIkNode.rotateHandler) {
                    cIkNode.rotateHandler.visible = true;
                }
            }
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;
        if (input.mouseLeft) {
            if (input.mouseLeftDownThisFrame) {
                // drag start
                if (input.mouseOver) {
                    // find mouse over handler
                    let topHoveredZ = Infinity;
                    let hoveredNode: ModelNode | null = null;
                    let hoveredCIkNode: CIkNode | null = null;
                    for (let chain of this.ikChains) {
                        for (let node of chain.children) {
                            const cIkNode = node.get(CIkNode);
                            cIkNode.updateHandlersHoverState(node, view);
                            if (cIkNode.rotateHandlerHovered && cIkNode.rotateHandlerZ < topHoveredZ) {
                                topHoveredZ = cIkNode.rotateHandlerZ;
                                hoveredNode = node;
                                hoveredCIkNode = cIkNode;
                            }
                        }
                    }
                    if (hoveredNode && hoveredCIkNode) {
                        // clicked on rotation handler
                        this.node = hoveredNode;
                        this.swing = true;
                        this.activeView = view.index;
                        const chain = hoveredNode.parent!;
                        const chainMat = chain.getWorldMatrix();
                        this.mouse0.copy(hoveredCIkNode.end).applyMatrix4(chainMat);
                        linePanelIntersection(this.mouse0, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                        this.invMat.copy(chainMat).invert();
                        this.nodeStart0.copy(hoveredCIkNode.start);
                        this.nodeEnd0.copy(hoveredCIkNode.end);
                        this.rotation0.copy(hoveredCIkNode.quaternion);
                        ctx.model.addSelection(this.node.id);
                    } else {
                        // clicked on internal object
                        let node: ModelNode | undefined = undefined;
                        for (let result of view.mousePick()) {
                            node = (result.object.userData as Object3DUserData).node;
                            while (node) {
                                if (node.has(CIkNode)) {
                                    break;
                                }
                                node = node.parent || undefined;
                            }
                            if (node) {
                                this.mouse0.copy(result.point);
                                break;
                            }
                        }
                        if (!node) {
                            ctx.model.selected = [];
                            return;
                        }
                        this.node = node;
                        this.swing = false;
                        this.activeView = view.index;
                        ctx.model.selected = [node.id];
                        const mat = node.getParentWorldMatrix();
                        this.invMat.copy(mat).invert();
                        _local0.copy(this.mouse0).applyMatrix4(this.invMat);
                        const cIkNode = node.get(CIkNode);
                        this.boneAxis.subVectors(cIkNode.end, cIkNode.start).normalize();
                        closestPointOnLine(this.origin, cIkNode.start, this.boneAxis, _local0);
                        this.boneAxis.transformDirection(mat);
                        this.rotation0.copy(cIkNode.quaternion);
                        if (this.origin.distanceTo(_local0) < 1e-8) {
                            this.node = undefined;
                        } else {
                            this.origin.applyMatrix4(mat);
                        }
                    }
                }
            } else if (this.activeView === view.index && this.node && !this.node.deleted) {
                // drag move
                // calculate det rot
                if (this.swing) {
                    // swing
                    linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                    _local0.copy(this.mouse0).applyMatrix4(this.invMat);
                    _local1.copy(_mouse1).applyMatrix4(this.invMat);
                    _det.subVectors(_local1, _local0);
                    _v0.subVectors(this.nodeEnd0, this.nodeStart0).normalize();
                    _v1.subVectors(this.nodeEnd0, this.nodeStart0).add(_det).normalize();
                    _detRot.setFromUnitVectors(_v0, _v1);
                } else {
                    // twist
                    if (Math.acos(Math.abs(this.boneAxis.dot(view.mouseRayN))) * 180 / Math.PI > 45) {
                        // side view
                        if (!linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.origin, view.mouseRayN)) {
                            return;
                        }
                        _dir.crossVectors(this.boneAxis, view.mouseRayN).normalize();
                        const radius = this.mouse0.distanceTo(this.origin);
                        const ROT_SPEED_RATIO = 0.4;
                        const angle = -_det.subVectors(_mouse1, this.mouse0).dot(_dir) / radius * Math.PI / 2 * ROT_SPEED_RATIO;
                        _dir.copy(this.boneAxis).transformDirection(this.invMat);
                        _detRot.setFromAxisAngle(_dir, angle);
                    } else {
                        // vertical view
                        if (!linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.origin, this.boneAxis)) {
                            return;
                        }
                        _local0.copy(this.mouse0).applyMatrix4(this.invMat);
                        _local1.copy(_mouse1).applyMatrix4(this.invMat);
                        _o.copy(this.origin).applyMatrix4(this.invMat);
                        _v0.subVectors(_local0, _o).normalize();
                        _v1.subVectors(_local1, _o).normalize();
                        _dir.copy(this.boneAxis).transformDirection(this.invMat);
                        const angle = angleBetween2VectorsInPanel(_dir, _v0, _v1);
                        _detRot.setFromAxisAngle(_dir, angle);
                    }
                }
                // apply rotation
                _forward.set(0, 0, 1).applyQuaternion(this.rotation0).applyQuaternion(_detRot);
                _up.set(0, 1, 0).applyQuaternion(this.rotation0).applyQuaternion(_detRot);
                quatFromForwardUp(_rotation, _forward, _up);
                const chain = this.node.parent!;
                const index = chain.children.indexOf(this.node);
                if (index > 0) {
                    const prev = chain.children[index - 1];
                    _invQuat.copy(prev.get(CIkNode).quaternion).invert();
                    _rotation.multiplyQuaternions(_invQuat, _rotation);
                }
                ctx.history.setValue(this.node, CIkNodeRotation, new Euler().setFromQuaternion(_rotation));
            }
        } else if (this.activeView === view.index) {
            // drag end
            this.activeView = -1;
            this.node = undefined;
        }
    }

    onUnselected(ctx: EditorContext) {
        this.cleanup(ctx);
    }

    private cleanup(ctx: EditorContext) {
        // hide handlers
        for (let chain of this.ikChains) {
            if (chain.deleted) {
                continue;
            }
            for (let node of chain.children) {
                if (node.deleted) {
                    continue;
                }
                const cIkNode = node.get(CIkNode);
                cIkNode.resetHandlers(ctx);
            }
        }
        this.ikChains.length = 0;
    }
}
