import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CIkNode from '../model/components/CIkNode';
import CIkNodeLength from '../model/components/CIkNodeLength';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import CScale from '../model/components/CScale';
import ModelNode from '../model/ModelNode';
import {linePanelIntersection, quatFromForwardUp} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './IkBind.png';

const _mouse1 = new Vector3();
const _local0 = new Vector3();
const _local1 = new Vector3();
const _det = new Vector3();
const _chainMat = new Matrix4();
const _invNodeMat = new Matrix4();
const _mat1 = new Matrix4();
const _translation = new Vector3();
const _rotation = new Quaternion();
const _detRot = new Quaternion();
const _quat = new Quaternion();
const _invQuat = new Quaternion();
const _scale = new Vector3();
const _v0 = new Vector3();
const _v1 = new Vector3();
const _forward = new Vector3();
const _up = new Vector3();
const _nodeTranslation = new Vector3();
const _nodeRotation = new Quaternion();
const _nodeScale = new Vector3();

export default class IkBindTool extends EditorTool {
    label = 'IK Bind';
    icon = icon;

    private activeView = -1;
    /** Selected ik chain nodes */
    private ikChains: ModelNode[] = [];
    /** Ik node being dragged */
    private node?: ModelNode;
    /** Dragging with rotation handler or chain root moving handler */
    private rotate = false;
    /** Dragging start mouse position in world space */
    private mouse0 = new Vector3();
    private nodeInvMat = new Matrix4();
    private chainInvMat = new Matrix4();
    /** Dragging start ik chain translation in local space */
    private chainPosition0 = new Vector3();
    /** Dragging start ik node start position in ik chain local space */
    private nodeStart0 = new Vector3();
    /** Dragging start ik node end position in ik chain local space */
    private nodeEnd0 = new Vector3();
    /** Dragging start ik node rotation in ik chain local space */
    private nodeRotation0 = new Quaternion();
    /** Dragging start ik nodes local matrices */
    private nodeLocalMat0 = new Map<number, Matrix4>();
    /** Dragging start ik nodes internal objects world matrices */
    private objWorldMat0 = new Map<number, Matrix4>();

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
                if (cIkNode.hingeIndicator) {
                    cIkNode.hingeIndicator.visible = cIkNode.hingeEnabled;
                }
                if (i === 0) {
                    if (cIkNode.moveHandler) {
                        cIkNode.moveHandler.visible = true;
                    }
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
                if (input.pointerOver) {
                    // find mouse over handler
                    let topHoveredZ = Infinity;
                    let hoveredNode: ModelNode | null = null;
                    let hoveredCIkNode: CIkNode | null = null;
                    for (let chain of this.ikChains) {
                        for (let node of chain.children) {
                            const cIkNode = node.get(CIkNode);
                            cIkNode.updateHandlersHoverState(node, view);
                            if (cIkNode.moveHandlerHovered && cIkNode.moveHandlerZ < topHoveredZ) {
                                topHoveredZ = cIkNode.moveHandlerZ;
                                hoveredNode = node;
                                hoveredCIkNode = cIkNode;
                            }
                            if (cIkNode.rotateHandlerHovered && cIkNode.rotateHandlerZ < topHoveredZ) {
                                topHoveredZ = cIkNode.rotateHandlerZ;
                                hoveredNode = node;
                                hoveredCIkNode = cIkNode;
                            }
                        }
                    }
                    if (hoveredNode && hoveredCIkNode) {
                        this.node = hoveredNode;
                        this.rotate = hoveredCIkNode.rotateHandlerHovered;
                        this.activeView = view.index;
                        const chain = hoveredNode.parent!;
                        const chainMat = chain.getWorldMatrix();
                        this.mouse0
                            .copy(this.rotate ? hoveredCIkNode.end : hoveredCIkNode.start)
                            .applyMatrix4(chainMat);
                        linePanelIntersection(this.mouse0, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                        this.nodeInvMat.copy(chainMat).invert();
                        this.chainInvMat.copy(chain.getParentWorldMatrix()).invert();
                        this.nodeStart0.copy(hoveredCIkNode.start);
                        this.nodeEnd0.copy(hoveredCIkNode.end);
                        this.nodeRotation0.copy(hoveredCIkNode.quaternion);
                        this.chainPosition0.copy(chain.value(CPosition));
                        this.nodeLocalMat0.clear();
                        this.objWorldMat0.clear();
                        for (let node of chain.children) {
                            this.nodeLocalMat0.set(node.id, new Matrix4().copy(node.getLocalMatrix()));
                            for (let internalObj of node.children) {
                                this.objWorldMat0.set(internalObj.id, new Matrix4().copy(internalObj.getWorldMatrix()));
                            }
                        }
                        ctx.model.addSelection(this.node.id);
                    }
                }
            } else if (this.activeView === view.index && this.node && !this.node.deleted) {
                // drag move
                const chain = this.node.parent!;
                linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN);
                if (this.rotate) {
                    // drag rotate / resize length
                    _local0.copy(this.mouse0).applyMatrix4(this.nodeInvMat);
                    _local1.copy(_mouse1).applyMatrix4(this.nodeInvMat);
                    _det.subVectors(_local1, _local0);
                    _v0.subVectors(this.nodeEnd0, this.nodeStart0).normalize();
                    _v1.copy(this.nodeEnd0).add(_det).sub(this.nodeStart0);
                    let nodeLength = _v1.length();
                    _v1.normalize();
                    _detRot.setFromUnitVectors(_v0, _v1);
                    _forward.set(0, 0, 1).applyQuaternion(this.nodeRotation0).applyQuaternion(_detRot);
                    _up.set(0, 1, 0).applyQuaternion(this.nodeRotation0).applyQuaternion(_detRot);
                    quatFromForwardUp(_rotation, _forward, _up);
                    _nodeRotation.copy(_rotation);
                    const index = chain.children.indexOf(this.node);
                    if (index > 0) {
                        const prev = chain.children[index - 1];
                        _invQuat.copy(prev.get(CIkNode).quaternion).invert();
                        _rotation.multiplyQuaternions(_invQuat, _rotation);
                    }
                    let changed = ctx.history.setValue(
                        this.node,
                        CIkNodeRotation,
                        new Euler().setFromQuaternion(_rotation)
                    );
                    if (ctx.options.allowModifyingBoneLengthWhenBindingIk) {
                        changed = ctx.history.setValue(
                            this.node,
                            CIkNodeLength,
                            nodeLength
                        ) || changed;
                    }
                    if (changed && ctx.options.keepInternalTransformWhenBindingIk) {
                        // objWorldMat1 = objWorldMat0
                        // boneWorldMat1 * objLocalMat1 = objWorldMat0
                        // objLocalMat1 = inv(boneWorldMat1) * objWorldMat0
                        // objLocalMat1 = inv(chainWorldMat * boneLocalMat1) * objWorldMat0
                        let i = chain.children.indexOf(this.node);
                        if (i < 0) {
                            return;
                        }
                        _nodeTranslation.copy(this.node.get(CIkNode).start);
                        _nodeScale.set(1, 1, 1);
                        const chainMat = chain.getWorldMatrix();
                        for (let len = chain.children.length; i < len; ++i) {
                            const node = chain.children[i];
                            _invNodeMat.compose(_nodeTranslation, _nodeRotation, _nodeScale);
                            _invNodeMat.multiplyMatrices(chainMat, _invNodeMat).invert();
                            for (let internalObj of node.children) {
                                const mat0 = this.objWorldMat0.get(internalObj.id);
                                if (!mat0) {
                                    continue;
                                }
                                _mat1.multiplyMatrices(_invNodeMat, mat0);
                                _mat1.decompose(_translation, _rotation, _scale);
                                if (internalObj.has(CPosition)) {
                                    ctx.history.setValue(internalObj, CPosition, new Vector3().copy(_translation));
                                }
                                if (internalObj.has(CRotation)) {
                                    ctx.history.setValue(internalObj, CRotation, new Euler().setFromQuaternion(_rotation));
                                }
                            }
                            const j = i + 1;
                            if (j < len) {
                                _det.set(nodeLength, 0, 0).applyQuaternion(_nodeRotation);
                                _nodeTranslation.add(_det);
                                const next = chain.children[j];
                                _nodeRotation.multiply(_quat.setFromEuler(next.value(CIkNodeRotation)));
                                nodeLength = next.value(CIkNodeLength);
                            }
                        }
                    }
                } else {
                    // drag move chain root
                    _local0.copy(this.mouse0).applyMatrix4(this.chainInvMat);
                    _local1.copy(_mouse1).applyMatrix4(this.chainInvMat);
                    _det.subVectors(_local1, _local0);
                    const changed = ctx.history.setValue(chain, CPosition, new Vector3().copy(this.chainPosition0).add(_det));
                    if (changed && ctx.options.keepInternalTransformWhenBindingIk) {
                        // objWorldMat1 = objWorldMat0
                        // boneWorldMat1 * objLocalMat1 = objWorldMat0
                        // objLocalMat1 = inv(boneWorldMat1) * objWorldMat0
                        // objLocalMat1 = inv(chainWorldMat1 * boneLocalMat0) * objWorldMat0
                        // objLocalMat1 = inv(chainParentWorldMat * chainLocalMat1 * boneLocalMat0) * objWorldMat0
                        _translation.copy(this.chainPosition0).add(_det);
                        _rotation.setFromEuler(chain.value(CRotation));
                        _scale.setScalar(chain.value(CScale));
                        _chainMat.compose(_translation, _rotation, _scale);
                        _chainMat.multiplyMatrices(chain.getParentWorldMatrix(), _chainMat);
                        for (let node of chain.children) {
                            const nodeLocalMat0 = this.nodeLocalMat0.get(node.id);
                            if (!nodeLocalMat0) {
                                continue;
                            }
                            _invNodeMat.multiplyMatrices(_chainMat, nodeLocalMat0).invert();
                            for (let internalObj of node.children) {
                                const mat0 = this.objWorldMat0.get(internalObj.id);
                                if (!mat0) {
                                    continue;
                                }
                                _mat1.multiplyMatrices(_invNodeMat, mat0);
                                _mat1.decompose(_translation, _rotation, _scale);
                                if (internalObj.has(CPosition)) {
                                    ctx.history.setValue(internalObj, CPosition, new Vector3().copy(_translation));
                                }
                                if (internalObj.has(CRotation)) {
                                    ctx.history.setValue(internalObj, CRotation, new Euler().setFromQuaternion(_rotation));
                                }
                            }
                        }
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
