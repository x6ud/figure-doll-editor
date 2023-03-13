import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CHingeAxis from '../model/components/CHingeAxis';
import CIkNode from '../model/components/CIkNode';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import {Object3DUserData} from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import CScale from '../model/components/CScale';
import CShowMoveHandler from '../model/components/CShowMoveHandler';
import CShowRotateHandler from '../model/components/CShowRotateHandler';
import ModelNode from '../model/ModelNode';
import {
    angleBetween2VectorsInPanel,
    closestPointOnLine,
    getTranslation,
    linePanelIntersection,
    quatFromForwardUp
} from '../utils/math';
import EditorTool from './EditorTool';
import {
    resetIkChains,
    resolveIkChain,
    resolveLockedEnds,
    saveIkChainState,
    updateIkChainLocalMatrices,
    VirtualIkChain
} from './ik-resolve';
import icon from './IkMove.png';

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
const _scale = new Vector3();

export default class IkMoveTool extends EditorTool {
    label = 'Move IK Chain';
    icon = icon;

    private activeView = -1;
    /** Selected ik chain nodes */
    private ikChains: ModelNode[] = [];
    /** Ik node being dragged */
    private node?: ModelNode;
    private action: 'swing' | 'twist' | 'move' = 'swing';
    /** Dragging start mouse position in world space */
    private mouse0 = new Vector3();
    /** Rotation center in world space */
    private origin = new Vector3();
    /** Dragged bone's direction in world space */
    private boneAxis = new Vector3();
    /** Dragged ik chain's inverse world matrix */
    private invMat = new Matrix4();
    /** Dragged node's end position in ik chain's local space */
    private nodeEnd0 = new Vector3();
    /** Dragged node's rotation in ik chain's local space */
    private rotation0 = new Quaternion();
    /** Dragging start ik chain translation in local space */
    private position0 = new Vector3();
    /** Dragging start ik chain state */
    private chain0: VirtualIkChain | null = null;

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
                if (i === 0 && cIkNode.moveHandler) {
                    cIkNode.moveHandler.visible = chain.value(CShowMoveHandler);
                }
                if (cIkNode.rotateHandler) {
                    cIkNode.rotateHandler.visible = node.value(CShowRotateHandler);
                }
            }
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;
        if (input.mouseLeft) {
            if (input.mouseLeftDownThisFrame) {
                // drag start
                if (input.pointerOver) {
                    // find mouse over handler
                    let topHoveredZ = Infinity;
                    let hoveredNode: ModelNode | null = null;
                    let hoveredCIkNode: CIkNode | null = null;
                    let rotate = false;
                    for (let chain of this.ikChains) {
                        for (let node of chain.children) {
                            const cIkNode = node.get(CIkNode);
                            cIkNode.updateHandlersHoverState(node, view);
                            if (cIkNode.moveHandlerHovered && cIkNode.moveHandlerZ < topHoveredZ) {
                                topHoveredZ = cIkNode.moveHandlerZ;
                                hoveredNode = node;
                                hoveredCIkNode = cIkNode;
                                rotate = false;
                            }
                            if (cIkNode.rotateHandlerHovered && cIkNode.rotateHandlerZ < topHoveredZ) {
                                topHoveredZ = cIkNode.rotateHandlerZ;
                                hoveredNode = node;
                                hoveredCIkNode = cIkNode;
                                rotate = true;
                            }
                        }
                    }
                    if (hoveredNode && hoveredCIkNode) {
                        // clicked on rotation handler
                        this.node = hoveredNode;
                        this.action = rotate ? 'swing' : 'move';
                        this.activeView = view.index;
                        const chain = hoveredNode.parent!;
                        const chainMat = chain.getWorldMatrix();
                        if (rotate) {
                            this.mouse0.copy(hoveredCIkNode.end).applyMatrix4(chainMat);
                        } else {
                            this.position0.copy(chain.value(CPosition));
                            getTranslation(this.mouse0, chain.getWorldMatrix());
                        }
                        linePanelIntersection(this.mouse0, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                        if (rotate) {
                            this.invMat.copy(chainMat).invert();
                            this.nodeEnd0.copy(hoveredCIkNode.end);

                        } else {
                            this.invMat.copy(chain.getParentWorldMatrix()).invert();
                        }
                        ctx.model.addSelection(this.node.id);
                    } else {
                        // clicked on internal object
                        let node: ModelNode | undefined = undefined;
                        for (let result of view.mousePickVisible()) {
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
                        ctx.model.selected = [node.id];
                        if (node.value(CHingeAxis) !== 'none') {
                            return;
                        }
                        this.node = node;
                        this.action = 'twist';
                        this.activeView = view.index;
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
                    if (this.node) {
                        this.chain0 = saveIkChainState(this.node.parent!);
                    }
                }
            } else if (this.activeView === view.index && this.node && !this.node.deleted && this.chain0) {
                let changed = false;
                if (this.action === 'move') {
                    // drag move
                    linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                    _local0.copy(this.mouse0).applyMatrix4(this.invMat);
                    _local1.copy(_mouse1).applyMatrix4(this.invMat);
                    _det.subVectors(_local1, _local0);
                    const chain = this.node.parent!;
                    const position = new Vector3().addVectors(this.position0, _det);
                    changed = ctx.history.setValue(chain, CPosition, position);
                    _rotation.setFromEuler(chain.value(CRotation));
                    _scale.setScalar(chain.value(CScale));
                    this.chain0.localMat.compose(position, _rotation, _scale);
                    this.chain0.worldMat.multiplyMatrices(chain.getParentWorldMatrix(), this.chain0.localMat);
                } else {
                    // rotate
                    if (this.action === 'swing') {
                        // swing
                        linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                        _local0.copy(this.mouse0).applyMatrix4(this.invMat);
                        _local1.copy(_mouse1).applyMatrix4(this.invMat);
                        _det.subVectors(_local1, _local0);
                        if (_det.lengthSq() < 1e-6) {
                            return;
                        }
                        _v1.copy(this.nodeEnd0).add(_det);
                        this.mouse0.copy(_mouse1);
                        this.nodeEnd0.copy(_v1);
                        const index = this.chain0.children.findIndex(node => node.node.id === this.node!.id);
                        resolveIkChain(ctx, this.chain0, index, _v1);
                        changed = true;
                    } else {
                        // twist
                        // calculate det rot
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
                        changed = ctx.history.setValue(this.node, CIkNodeRotation, new Euler().setFromQuaternion(_rotation));
                        const virtualNode = this.chain0.children.find(node => node.node.id === this.node!.id)!;
                        virtualNode.localRotation.copy(_rotation);
                        updateIkChainLocalMatrices(this.chain0);
                    }
                }
                // resolve locked ends
                if (changed) {
                    // reset internal ik chains to dragging start state
                    // this avoids rotating joints into odd angles
                    for (let child of this.chain0.children) {
                        resetIkChains(child);
                    }
                    // move internal locked ended ik chains' targets to dragging start position
                    if (this.node.id === this.chain0.children[this.chain0.children.length - 1].node.id) {
                        for (let child of this.chain0.children) {
                            resolveLockedEnds(ctx, child);
                        }
                    } else {
                        resolveLockedEnds(ctx, this.chain0);
                    }
                }
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
