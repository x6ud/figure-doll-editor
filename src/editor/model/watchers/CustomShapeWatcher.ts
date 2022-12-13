import Class from '../../../common/type/Class';
import CSdfOperator from '../components/CSdfOperator';
import CSdfSymmetry from '../components/CSdfSymmetry';
import CTube from '../components/CTube';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

export default class CustomShapeWatcher implements ModelNodeChangedWatcher {

    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (componentClass === CTube) {
            node.get(CTube).dirty = true;
            if (node.parent) {
                node.parent.dirty = true;
            }
        } else if (componentClass === CSdfOperator) {
            node.get(CSdfOperator).dirty = true;
            if (node.parent) {
                node.parent.dirty = true;
            }
        } else if (componentClass === CSdfSymmetry) {
            node.get(CSdfSymmetry).dirty = true;
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
    }

}
