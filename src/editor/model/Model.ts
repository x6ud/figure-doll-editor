import Class from '../../common/type/Class';
import ModelNode from './ModelNode';
import ModelNodeChangedWatcher from './ModelNodeChangedWatcher';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeDef} from './ModelNodeDef';
import TransformWatcher from './watchers/TransformWatcher';

export default class Model {
    private nodesMap: Map<number, ModelNode> = new Map();

    nodes: ModelNode[] = [];
    watchers: ModelNodeChangedWatcher[] = [
        new TransformWatcher(),
    ];
    dirty: boolean = true;
    selected: number[] = [];

    addSelection(id: number) {
        if (!this.selected.includes(id)) {
            this.selected.push(id);
        }
    }

    isNodeExists(id: number): boolean {
        return this.nodesMap.has(id);
    }

    forEach(callback: (node: ModelNode) => void) {
        for (let node of this.nodes) {
            node.forEach(callback);
        }
    }

    getNode(id: number): ModelNode {
        const node = this.nodesMap.get(id);
        if (!node) {
            throw new Error(`Node #${id} does not exist`);
        }
        return node;
    }

    createNode(
        id: number,
        type: string,
        parent: ModelNode | null = null,
        index: number | null = null,
        data?: { [name: string]: any }
    ): ModelNode {
        if (this.isNodeExists(id)) {
            throw new Error(`Node #${id} already exists`);
        }
        const nodeDef = getModelNodeDef(type);
        const node = new ModelNode();
        node.id = id;
        node.type = type;
        for (let componentConstructor of nodeDef.components) {
            node.components[componentConstructor.name] = new componentConstructor();
        }
        node.parent = parent;
        if (data) {
            for (let name in data) {
                const component = node.components[name];
                if (component) {
                    component.value = data[name];
                }
            }
        }
        const list = parent ? parent.children : this.nodes;
        if (index != null) {
            list.splice(index, 0, node);
        } else {
            list.push(node);
        }
        this.nodesMap.set(id, node);
        if (parent) {
            for (let watcher of this.watchers) {
                watcher.onChildAdded(this, parent, node);
            }
        }
        this.dirty = true;
        return node;
    }

    removeNode(id: number) {
        if (!this.isNodeExists(id)) {
            return;
        }
        const node = this.getNode(id);
        if (node.parent) {
            for (let watcher of this.watchers) {
                watcher.onBeforeChildRemoved(this, node.parent, node);
            }
        }
        node.forEach(node => {
            this.nodesMap.delete(node.id);
            const index = this.selected.indexOf(node.id);
            if (index >= 0) {
                this.selected.splice(index, 1);
            }
        });
        const list = node.parent ? node.parent.children : this.nodes;
        const index = list.indexOf(node);
        if (index >= 0) {
            list.splice(index, 1);
        }
        node.forEach(node => {
            for (let name in node.components) {
                const component = node.components[name];
                component.onRemoved();
            }
        });
        this.dirty = true;
    }

    moveNode(node: ModelNode, parent: ModelNode | null, related: ModelNode | null, placeAfter: boolean) {
        const oldParent = node.parent;
        const oldList = oldParent ? oldParent.children : this.nodes;
        oldList.splice(oldList.indexOf(node), 1);
        const newList = parent ? parent.children : this.nodes;
        node.parent = parent;
        if (related) {
            const index = newList.indexOf(related);
            if (placeAfter) {
                newList.splice(index + 1, 0, node);
            } else {
                newList.splice(index, 0, node);
            }
        } else {
            if (placeAfter) {
                newList.push(node);
            } else {
                newList.unshift(node);
            }
        }
        this.dirty = true;
        for (let watcher of this.watchers) {
            watcher.onMoved(this, node, oldParent, parent);
        }
    }

    setValue<T>(node: ModelNode, componentClass: Class<ModelNodeComponent<T>>, value: T) {
        node.get(componentClass).value = value;
        node.dirty = true;
        this.dirty = true;
        for (let watcher of this.watchers) {
            watcher.onValueChanged(this, node, componentClass);
        }
    }

}
