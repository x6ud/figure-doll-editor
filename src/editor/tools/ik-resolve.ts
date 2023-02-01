import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import CHingeAngleRange from '../model/components/CHingeAngleRange';
import CHingeAxis from '../model/components/CHingeAxis';
import CIkNode from '../model/components/CIkNode';
import CIkNodeLength from '../model/components/CIkNodeLength';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import CLockEnd from '../model/components/CLockEnd';
import ModelNode from '../model/ModelNode';
import CcdChain from '../utils/ik/CcdChain';

class VirtualIkNode {
    node: ModelNode;
    length = 0;
    localRotation = new Quaternion();
    localRotation0 = new Quaternion();
    hingeEnabled = false;
    hingeAxis = new Vector3(1, 0, 0);
    lowerAngle = -Math.PI;
    upperAngle = +Math.PI;
    localMat = new Matrix4();
    worldMat = new Matrix4();
    hasLockEndChild = false;
    children: (VirtualIkChain | VirtualContainer)[] = [];
    parent: VirtualIkChain | null = null;
    start = new Vector3();
    end = new Vector3();
    rotation = new Quaternion();

    constructor(node: ModelNode) {
        this.node = node;
    }
}

class VirtualContainer {
    localMat = new Matrix4();
    worldMat = new Matrix4();
    hasLockEndChild = false;
    children: (VirtualIkChain | VirtualContainer)[] = [];
    parent: VirtualIkNode | VirtualContainer | null = null;
}

export class VirtualIkChain {
    children: VirtualIkNode[] = [];
    localMat = new Matrix4();
    worldMat = new Matrix4();
    hasLockEndChild = false;
    lockEnd = false;
    endWorld = new Vector3();
    parent: VirtualIkNode | VirtualContainer | null = null;
}

function createVirtualNode(node: ModelNode) {
    const children: (VirtualIkChain | VirtualIkNode | VirtualContainer)[] = [];
    let hasLockEndChild = false;
    for (let child of node.children) {
        const virtual = createVirtualNode(child);
        if (virtual) {
            children.push(virtual);
            if (virtual.hasLockEndChild) {
                hasLockEndChild = true;
            } else if ((virtual as VirtualIkChain).lockEnd) {
                hasLockEndChild = true;
            }
        }
    }
    switch (node.type) {
        case 'Container': {
            const ret = new VirtualContainer();
            ret.localMat.copy(node.getLocalMatrix());
            ret.worldMat.copy(node.getWorldMatrix());
            ret.hasLockEndChild = hasLockEndChild;
            ret.children = children as (VirtualIkChain | VirtualContainer)[];
            for (let child of ret.children) {
                child.parent = ret;
            }
            return ret;
        }
        case 'IKChain': {
            const ret = new VirtualIkChain();
            ret.localMat.copy(node.getLocalMatrix());
            ret.worldMat.copy(node.getWorldMatrix());
            ret.lockEnd = node.value(CLockEnd);
            ret.hasLockEndChild = hasLockEndChild;
            ret.children = children as VirtualIkNode[];
            if (ret.lockEnd && node.children.length) {
                const tail = node.children[node.children.length - 1];
                ret.endWorld.copy(tail.get(CIkNode).end);
                ret.endWorld.applyMatrix4(ret.worldMat);
            }
            for (let child of ret.children) {
                child.parent = ret;
            }
            return ret;
        }
        case 'IKNode': {
            const ret = new VirtualIkNode(node);
            ret.localMat.copy(node.getLocalMatrix());
            ret.worldMat.copy(node.getWorldMatrix());
            ret.length = node.value(CIkNodeLength);
            ret.localRotation.setFromEuler(node.value(CIkNodeRotation));
            ret.localRotation0.copy(ret.localRotation);
            switch (node.value(CHingeAxis)) {
                case 'horizontal':
                    ret.hingeEnabled = true;
                    ret.hingeAxis.set(0, 1, 0);
                    break;
                case 'vertical':
                    ret.hingeEnabled = true;
                    ret.hingeAxis.set(0, 0, 1);
                    break;
                default:
                    ret.hingeEnabled = false;
                    break;
            }
            const hingeRange = node.value(CHingeAngleRange);
            ret.lowerAngle = hingeRange[0] / 180 * Math.PI;
            ret.upperAngle = hingeRange[1] / 180 * Math.PI;
            ret.hasLockEndChild = hasLockEndChild;
            ret.children = children as (VirtualIkChain | VirtualContainer)[];
            for (let child of ret.children) {
                child.parent = ret;
            }
            return ret;
        }
    }
    return null;
}

export function saveIkChainState(ikChain: ModelNode): VirtualIkChain {
    return createVirtualNode(ikChain) as VirtualIkChain;
}

const _ccd = new CcdChain();
const _scale = new Vector3(1, 1, 1);

export function resolveIkChain(ctx: EditorContext, chain: VirtualIkChain, nodeIdx: number, target: Vector3) {
    _ccd.resize(nodeIdx + 1);
    for (let i = 0; i <= nodeIdx; ++i) {
        const joint = _ccd.joints[i];
        const node = chain.children[i];
        joint.length = node.length;
        joint.localRotation.copy(node.localRotation);
        joint.hingeEnabled = node.hingeEnabled;
        joint.hingeAxis.copy(node.hingeAxis);
        joint.lowerAngle = node.lowerAngle;
        joint.upperAngle = node.upperAngle;
    }
    _ccd.resolve(target);
    for (let i = 0; i <= nodeIdx; ++i) {
        const joint = _ccd.joints[i];
        const node = chain.children[i];
        node.localRotation.copy(joint.localRotation);
        ctx.history.setValue(node.node, CIkNodeRotation, new Euler().setFromQuaternion(node.localRotation));
    }
    updateIkChainLocalMatrices(chain);
}

export function updateIkChainLocalMatrices(chain: VirtualIkChain) {
    for (let i = 0, len = chain.children.length; i < len; ++i) {
        const node = chain.children[i];
        if (i === 0) {
            node.rotation.copy(node.localRotation);
            node.start.set(0, 0, 0);
        } else {
            const prev = chain.children[i - 1];
            node.rotation.multiplyQuaternions(prev.rotation, node.localRotation);
            node.start.copy(prev.end);
        }
        node.end.set(node.length, 0, 0).applyQuaternion(node.rotation).add(node.start);
        node.localMat.compose(node.start, node.rotation, _scale);
    }
}

const _invMat = new Matrix4();
const _target = new Vector3();

export function resolveLockedEnds(ctx: EditorContext, node: VirtualIkChain | VirtualIkNode | VirtualContainer) {
    if (node.hasLockEndChild || (node as VirtualIkChain).lockEnd) {
        if (node.parent) {
            node.worldMat.multiplyMatrices(node.parent.worldMat, node.localMat);
        }
    }
    if ((node as VirtualIkChain).lockEnd) {
        const chain = node as VirtualIkChain;
        _invMat.copy(chain.worldMat).invert();
        _target.copy(chain.endWorld).applyMatrix4(_invMat);
        resolveIkChain(ctx, chain, chain.children.length - 1, _target);
    }
    if (node.hasLockEndChild) {
        for (let child of node.children) {
            resolveLockedEnds(ctx, child);
        }
    }
}

export function resetIkChains(node: VirtualIkChain | VirtualIkNode | VirtualContainer) {
    if (node instanceof VirtualIkChain) {
        for (let child of node.children) {
            child.localRotation.copy(child.localRotation0);
        }
    }
    if (node.hasLockEndChild) {
        for (let child of node.children) {
            resetIkChains(child);
        }
    }
}
