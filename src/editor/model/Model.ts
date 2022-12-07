import Class from '../../common/type/Class';
import ModelNode from './ModelNode';
import ModelNodeChangedWatcher from './ModelNodeChangedWatcher';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeComponentDef} from './ModelNodeComponentDef';
import {getModelNodeDef} from './ModelNodeDef';
import BoxWatcher from './watchers/BoxWatcher';
import ImageWatcher from './watchers/ImageWatcher';
import ObjWatcher from './watchers/ObjWatcher';
import TransformWatcher from './watchers/TransformWatcher';
import TubeWatcher from './watchers/TubeWatcher';

export default class Model {
    private nodesMap: Map<number, ModelNode> = new Map();

    nodes: ModelNode[] = [];
    watchers: ModelNodeChangedWatcher[] = [
        new TransformWatcher(),
        new ImageWatcher(),
        new ObjWatcher(),
        new BoxWatcher(),
        new TubeWatcher(),
    ];
    dirty: boolean = true;
    selected: number[] = [];

    reset() {
        this.selected = [];
        this.dirty = false;
        for (let id of this.nodes.map(node => node.id)) {
            this.removeNode(id);
        }
    }

    addSelection(id: number) {
        if (!this.selected.includes(id)) {
            this.selected.push(id);
        }
    }

    isNodeExists(id: number, type?: string): boolean {
        if (type) {
            const node = this.nodesMap.get(id);
            return node?.type === type;
        }
        return this.nodesMap.has(id);
    }

    /** Iterate over all nodes. Retuning false in callback to break the loop. */
    forEach(callback: (node: ModelNode) => void | boolean): void | boolean {
        for (let node of this.nodes) {
            if (node.forEach(callback) === false) {
                return false;
            }
        }
    }

    getNode(id: number): ModelNode {
        const node = this.nodesMap.get(id);
        if (!node) {
            throw new Error(`Node #${id} does not exist`);
        }
        return node;
    }

    getSelectedNodes(): ModelNode[] {
        return this.selected.map(id => this.getNode(id));
    }

    /** Returns all selected nodes excluding nested child nodes. */
    getTopmostSelectedNodes(): ModelNode[] {
        const ret: ModelNode[] = [];
        for (let id of this.selected) {
            const node = this.getNode(id);
            let valid = true;
            for (let parent = node.parent; parent; parent = parent.parent) {
                if (this.selected.includes(parent.id)) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                ret.push(node);
            }
        }
        return ret;
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
                    const componentDef = getModelNodeComponentDef(name);
                    component.value = componentDef.clone ? componentDef.clone(data[name]) : data[name];
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
        node.deleted = true;
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
        node.dirty = true;
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
