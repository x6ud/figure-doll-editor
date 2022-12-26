import Class from '../../../common/type/Class';
import CIkNode from '../components/CIkNode';
import CIkNodeLength from '../components/CIkNodeLength';
import CIkNodeRotation from '../components/CIkNodeRotation';
import CObject3D from '../components/CObject3D';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

const ikNodeComponents = [CIkNodeLength, CIkNodeRotation];

function markIkChainDirty(ikChain: ModelNode | null, ikNode?: ModelNode) {
    if (!ikChain) {
        return;
    }
    ikChain.dirty = true;
    let i = Math.max(0, ikNode ? ikChain.children.indexOf(ikNode) : 0);
    for (let len = ikChain.children.length; i < len; ++i) {
        const ikNode = ikChain.children[i];
        const cIkNode = ikNode.get(CIkNode);
        if (cIkNode) {
            ikNode.dirty = true;
            cIkNode.dirty = true;
        }
        const cObject3D = ikNode.get(CObject3D);
        if (cObject3D) {
            cObject3D.localTransformChanged = true;
            cObject3D.worldTransformChanged = true;
        }
    }
}

export default class IkNodeWatcher implements ModelNodeChangedWatcher {
    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (ikNodeComponents.includes(componentClass)) {
            markIkChainDirty(node.parent, node);
        }
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        if (node.has(CIkNode)) {
            markIkChainDirty(oldParent);
            markIkChainDirty(newParent, node);
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
        if (child.has(CIkNode)) {
            markIkChainDirty(node, child);
        }
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
        if (child.has(CIkNode)) {
            markIkChainDirty(node, child);
        }
    }
}
