import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import CFlipDirection from '../model/components/CFlipDirection';
import CIkNode from '../model/components/CIkNode';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import ModelNode from '../model/ModelNode';
import {getAxisAngle, getRotation, quatFromForwardUp} from '../utils/math';
import CDisableFlip from "../model/components/CDisableFlip";

const _axis = new Vector3();
const _ikNodeQuad = new Quaternion();
const _right = new Vector3(1, 0, 0);
const _up = new Vector3(0, 1, 0);
const _forward = new Vector3(0, 0, 1);

export function flipNode(ctx: EditorContext, node: ModelNode, mode: 'flip' | 'left-to-right' | 'right-to-left') {
    node = toRaw(node);

    let prevInvQuat1: Quaternion | undefined = undefined;
    if (node.type === 'IKNode') {
        const chain = node.parent!;
        const idx = chain.children.findIndex(child => child.id === node.id);
        if (idx) {
            const prev = chain.children[idx - 1];
            const cIkNode = prev.get(CIkNode);
            prevInvQuat1 = new Quaternion().copy(cIkNode.quaternion).invert();
        }
    }
    processMiddleNode(
        node,
        new Vector3(),
        new Vector3(0, 0, 1),
        new Matrix4(),
        new Matrix4(),
        new Matrix4(),
        prevInvQuat1
    );

    function processMiddleNode(node: ModelNode,
                               flipOrigin: Vector3,
                               flipDir: Vector3,
                               parentMat0: Matrix4,
                               parentMat1: Matrix4,
                               invParentMat1: Matrix4,
                               prevInvQuat1?: Quaternion,
    ) {
        const local0 = node.getLocalMatrix();
        const translation = new Vector3();
        const rotation = new Quaternion();
        const scale = new Vector3();
        const enableFlip = !(node.has(CDisableFlip) && node.value(CDisableFlip));
        if (enableFlip) {
            local0.decompose(translation, rotation, scale);
            const mat0 = new Matrix4().multiplyMatrices(parentMat0, local0);
            if (mode === 'flip') {
                const angle = getAxisAngle(_axis, rotation);
                _axis.applyMatrix4(parentMat0);
                _axis.sub(flipOrigin);
                _axis.reflect(flipDir);
                _axis.add(flipOrigin);
                _axis.applyMatrix4(invParentMat1);
                _axis.normalize();
                rotation.setFromAxisAngle(_axis, -angle);

                translation.applyMatrix4(parentMat0);
                translation.sub(flipOrigin);
                translation.reflect(flipDir);
                translation.add(flipOrigin);
                translation.applyMatrix4(invParentMat1);
            } else {
                _right.set(1, 0, 0).applyQuaternion(rotation);
                _up.set(0, 1, 0).applyQuaternion(rotation);
                _right.z = 0;
                _right.normalize();
                _up.z = 0;
                _up.normalize();
                _forward.crossVectors(_right, _up).normalize();
                quatFromForwardUp(rotation, _forward, _up);

                translation.z = 0;
            }
            if (node.has(CRotation)) {
                ctx.history.setValue(node, CRotation, new Euler().setFromQuaternion(rotation));
            }
            if (node.has(CIkNodeRotation)) {
                if (prevInvQuat1) {
                    _ikNodeQuad.multiplyQuaternions(prevInvQuat1, rotation);
                } else {
                    _ikNodeQuad.copy(rotation);
                }
                ctx.history.setValue(node, CIkNodeRotation, new Euler().setFromQuaternion(_ikNodeQuad));
            }

            const mat1 = new Matrix4().compose(translation, rotation, scale);
            mat1.multiplyMatrices(parentMat1, mat1);
            const invMat1 = new Matrix4().copy(mat1).invert();

            const visited = new Set<number>();
            let prevInvQuat: Quaternion | undefined = undefined;
            for (let child of node.children) {
                if (visited.has(child.id)) {
                    continue;
                }
                visited.add(child.id);
                const mirror = findMirrorNode(child, node);
                if (mirror) {
                    visited.add(mirror.id);
                    let left = child;
                    let right = mirror;
                    if (child.has(CPosition)) {
                        const pos = child.value(CPosition);
                        if (pos.z > 0) {
                            right = child;
                            left = mirror;
                        }
                    }
                    processMirrorNode(
                        flipOrigin,
                        flipDir,
                        left,
                        parentMat0,
                        parentMat1,
                        invParentMat1,
                        prevInvQuat,
                        right,
                        parentMat0,
                        parentMat1,
                        invParentMat1,
                        prevInvQuat,
                    );
                } else {
                    const {rotation} = processMiddleNode(child, flipOrigin, flipDir, mat0, mat1, invMat1, prevInvQuat);
                    prevInvQuat = new Quaternion().copy(rotation).invert();
                }
            }
        }

        return {rotation};
    }

    function processMirrorNode(
        flipOrigin: Vector3,
        flipDir: Vector3,
        left: ModelNode,
        leftParentMat0: Matrix4,
        leftParentMat1: Matrix4,
        leftInvParentMat1: Matrix4,
        leftPrevInvQuat1: Quaternion | undefined,
        right: ModelNode,
        rightParentMat0: Matrix4,
        rightParentMat1: Matrix4,
        rightInvParentMat1: Matrix4,
        rightPrevInvQuat1: Quaternion | undefined,
    ) {
        const local0Left = left.getLocalMatrix();
        const translationLeft = new Vector3();
        const rotationLeft = new Quaternion();
        const scaleLeft = new Vector3();
        local0Left.decompose(translationLeft, rotationLeft, scaleLeft);
        const mat0Left = new Matrix4().multiplyMatrices(leftParentMat0, local0Left);

        const local0Right = right.getLocalMatrix();
        const translationRight = new Vector3();
        const rotationRight = new Quaternion();
        const scaleRight = new Vector3();
        local0Right.decompose(translationRight, rotationRight, scaleRight);
        const mat0Right = new Matrix4().multiplyMatrices(rightParentMat0, local0Right);

        const enableFlip = !(node.has(CDisableFlip) && node.value(CDisableFlip));

        if (enableFlip) {
            if (mode === 'flip' || mode === 'left-to-right') {
                const angle = getAxisAngle(_axis, rotationLeft);
                _axis.applyMatrix4(leftParentMat0);
                _axis.sub(flipOrigin);
                _axis.reflect(flipDir);
                _axis.add(flipOrigin);
                _axis.applyMatrix4(leftInvParentMat1);
                _axis.normalize();
                rotationLeft.setFromAxisAngle(_axis, -angle);

                translationLeft.applyMatrix4(leftParentMat0);
                translationLeft.sub(flipOrigin);
                translationLeft.reflect(flipDir);
                translationLeft.add(flipOrigin);
                translationLeft.applyMatrix4(leftInvParentMat1);

                if (right.has(CRotation)) {
                    ctx.history.setValue(right, CRotation, new Euler().setFromQuaternion(rotationLeft));
                }
                if (right.has(CIkNodeRotation)) {
                    if (leftPrevInvQuat1) {
                        _ikNodeQuad.multiplyQuaternions(leftPrevInvQuat1, rotationLeft);
                    } else {
                        _ikNodeQuad.copy(rotationLeft);
                    }
                    ctx.history.setValue(right, CIkNodeRotation, new Euler().setFromQuaternion(_ikNodeQuad));
                }
            }
            if (mode === 'flip' || mode === 'right-to-left') {
                const angle = getAxisAngle(_axis, rotationRight);
                _axis.applyMatrix4(rightParentMat0);
                _axis.sub(flipOrigin);
                _axis.reflect(flipDir);
                _axis.add(flipOrigin);
                _axis.applyMatrix4(rightInvParentMat1);
                _axis.normalize();
                rotationRight.setFromAxisAngle(_axis, -angle);

                translationRight.applyMatrix4(rightParentMat0);
                translationRight.sub(flipOrigin);
                translationRight.reflect(flipDir);
                translationRight.add(flipOrigin);
                translationRight.applyMatrix4(rightInvParentMat1);

                if (left.has(CRotation)) {
                    ctx.history.setValue(left, CRotation, new Euler().setFromQuaternion(rotationRight));
                }
                if (left.has(CIkNodeRotation)) {
                    if (rightPrevInvQuat1) {
                        _ikNodeQuad.multiplyQuaternions(rightPrevInvQuat1, rotationRight);
                    } else {
                        _ikNodeQuad.copy(rotationRight);
                    }
                    ctx.history.setValue(left, CIkNodeRotation, new Euler().setFromQuaternion(_ikNodeQuad));
                }
            }

            const mat1Left = new Matrix4().compose(translationLeft, rotationLeft, scaleLeft);
            mat1Left.multiplyMatrices(leftParentMat1, mat1Left);
            const invMat1Left = new Matrix4().copy(mat1Left).invert();
            const mat1Right = new Matrix4().compose(translationRight, rotationRight, scaleRight);
            mat1Right.multiplyMatrices(rightParentMat1, mat1Right);
            const invMat1Right = new Matrix4().copy(mat1Right).invert();

            let prevInvQuatLeft: Quaternion | undefined = undefined;
            let prevInvQuatRight: Quaternion | undefined = undefined;
            for (let child of left.children) {
                const mirror = findMirrorNode(child, right);
                if (mirror) {
                    const {rotationLeft, rotationRight} = processMirrorNode(
                        flipOrigin,
                        flipDir,
                        child,
                        mat0Left,
                        mat1Left,
                        invMat1Left,
                        prevInvQuatLeft,
                        mirror,
                        mat0Right,
                        mat1Right,
                        invMat1Right,
                        prevInvQuatRight,
                    );
                    prevInvQuatLeft = new Quaternion().copy(rotationLeft).invert();
                    prevInvQuatRight = new Quaternion().copy(rotationRight).invert();
                }
            }
        }

        return {rotationLeft, rotationRight};
    }

    function findMirrorNode(node: ModelNode, mirrorParent: ModelNode) {
        if (node.type === 'IKNode' && node.parent?.id === mirrorParent.id) {
            return null;
        }
        const pos = node.has(CPosition) ? node.value(CPosition) : null;
        if (node.has(CFlipDirection)) {
            for (let child of mirrorParent.children) {
                if (node.id === child.id) {
                    continue;
                }
                if (node.type !== child.type) {
                    continue;
                }
                if (node.instanceId === child.id || node.instanceId === child.instanceId) {
                    if (!pos || isMirrorPos(pos, child.value(CPosition))) {
                        return child;
                    }
                }
            }
        } else {
            for (let child of mirrorParent.children) {
                if (node.id === child.id) {
                    continue;
                }
                if (node.type !== child.type) {
                    continue;
                }
                if (child.has(CFlipDirection)) {
                    if (child.instanceId === node.id || child.instanceId === node.instanceId) {
                        if (!pos || isMirrorPos(pos, child.value(CPosition))) {
                            return child;
                        }
                    }
                }
            }
        }
        return null;

        function isMirrorPos(a: Vector3, b: Vector3) {
            return Math.abs(a.x - b.x) < 1e-8
                && Math.abs(a.y - b.y) < 1e-8
                && Math.abs(a.z + b.z) < 1e-8;
        }
    }
}
