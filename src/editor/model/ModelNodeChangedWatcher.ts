import Class from '../type/Class';
import Model from './Model';
import ModelNode from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';

export default interface ModelNodeChangedWatcher {

    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void;

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void;

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void;

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void;

}
