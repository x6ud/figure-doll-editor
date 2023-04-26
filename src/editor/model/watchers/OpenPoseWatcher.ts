import Class from '../../type/Class';
import COpenPoseKeypoint from '../components/COpenPoseKeypoint';
import COpenPoseRoot from '../components/COpenPoseRoot';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

export default class OpenPoseWatcher implements ModelNodeChangedWatcher {
    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (componentClass === COpenPoseRoot) {
            this.markPoseRootDirty(node);
        } else if (componentClass === COpenPoseKeypoint) {
            this.markPoseRootDirty(node);
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
        if (child.type === 'OpenPoseKeypoint') {
            this.markPoseRootDirty(node);
        }
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
        if (child.type === 'OpenPoseKeypoint') {
            this.markPoseRootDirty(node);
        }
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        if (node.type === 'OpenPoseKeypoint' && oldParent !== newParent) {
            oldParent && this.markPoseRootDirty(oldParent);
            newParent && this.markPoseRootDirty(newParent);
        }
    }

    private markPoseRootDirty(node: ModelNode) {
        if (node.has(COpenPoseRoot) && node.value(COpenPoseRoot)) {
            node.dirty = true;
            node.get(COpenPoseRoot).dirty = true;
        } else if (node.parent) {
            this.markPoseRootDirty(node.parent);
        }
    }
}
