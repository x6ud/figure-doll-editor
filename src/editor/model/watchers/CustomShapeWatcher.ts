import Class from '../../../common/type/Class';
import CSdfDirty from '../components/CSdfDirty';
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
                node.parent.get(CSdfDirty).value = true;
            }
        } else if (componentClass === CSdfOperator) {
            if (node.parent) {
                node.parent.dirty = true;
                node.parent.get(CSdfDirty).value = true;
            }
        } else if (componentClass === CSdfSymmetry) {
            node.get(CSdfDirty).value = true;
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
        if (node.type === 'Shape') {
            node.dirty = true;
            node.get(CSdfDirty).value = true;
        }
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
        if (node.type === 'Shape') {
            node.dirty = true;
            node.get(CSdfDirty).value = true;
        }
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        if (oldParent?.type === 'Shape') {
            oldParent.dirty = true;
            oldParent.get(CSdfDirty).value = true;
        }
        if (newParent?.type === 'Shape') {
            newParent.dirty = true;
            newParent.get(CSdfDirty).value = true;
        }
    }

}
