import Class from '../../../common/type/Class';
import CVertices from '../components/CVertices';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

export default class ClayWatcher implements ModelNodeChangedWatcher {
    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (componentClass === CVertices) {
            node.get(CVertices).dirty = true;
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
    }
}
