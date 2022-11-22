import Class from '../../common/type/Class';
import ModelNode from './ModelNode';
import ModelNodeChangedWatcher from './ModelNodeChangedWatcher';
import ModelNodeComponent from './ModelNodeComponent';
import TransformWatcher from './watchers/TransformWatcher';

export default class Model {
    nodes: ModelNode[] = [];
    watchers: ModelNodeChangedWatcher[] = [
        new TransformWatcher(),
    ];
    dirty: boolean = true;
    selected: number[] = [];

    setValue<T>(node: ModelNode, componentClass: Class<ModelNodeComponent<T>>, value: T) {
        node.get(componentClass).value = value;
        node.dirty = true;
        this.dirty = true;
        for (let watcher of this.watchers) {
            watcher.onValueChanged(this, node, componentClass);
        }
    }
}
