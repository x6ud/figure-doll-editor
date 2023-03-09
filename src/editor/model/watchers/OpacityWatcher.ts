import Class from '../../type/Class';
import COpacity from '../components/COpacity';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

export default class OpacityWatcher implements ModelNodeChangedWatcher {
    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (componentClass === COpacity) {
            node.forEach(node => node.dirty = true);
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        node.forEach(node => node.dirty = true);
    }
}
