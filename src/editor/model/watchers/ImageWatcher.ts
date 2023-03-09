import Class from '../../type/Class';
import CImage from '../components/CImage';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

export default class ImageWatcher implements ModelNodeChangedWatcher {

    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (componentClass === CImage) {
            node.get(CImage).dirty = true;
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
    }

}
