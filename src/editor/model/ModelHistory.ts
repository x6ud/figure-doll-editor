import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import Class from '../../common/type/Class';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import Model from './Model';
import ModelNode, {ModelNodeChildJson, ModelNodeJson} from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeComponentDef} from './ModelNodeComponentDef';

const MAX_STACK_SIZE = 200;

type Record = {
    hash: string;
    redo: () => void;
    undo: () => void;
}

export default class ModelHistory {
    private model: Model;
    private enableMerge = true;
    private currentFrameRecords: Record[] = [];
    private redoStack: Record[] = [];
    private undoStack: Record[] = [];
    private nextNodeId: number = 0;
    dirty = false;
    private lastEventTarget: EventTarget | null = null;
    private onMouseDown = (e: MouseEvent) => {
        this.lastEventTarget = e.target;
        this.enableMerge = false;
    };
    private onKeyDown = (e: KeyboardEvent) => {
        if (this.lastEventTarget !== e.target) {
            this.lastEventTarget = e.target;
            this.enableMerge = false;
        }
    };

    constructor(model: Model) {
        this.model = model;
    }

    setup() {
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('keydown', this.onKeyDown);
    }

    unload() {
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('keydown', this.onKeyDown);
    }

    clear() {
        this.dirty = false;
        this.currentFrameRecords.length = 0;
        this.redoStack.length = 0;
        this.undoStack.length = 0;
    }

    save() {
        this.dirty = false;
    }

    update() {
        this.nextNodeId = 0;
        if (!this.currentFrameRecords.length) {
            return;
        }
        this.redoStack.length = 0;

        const redoList: (() => void)[] = [];
        const undoList: (() => void)[] = [];
        for (let record of this.currentFrameRecords) {
            record.redo();
            redoList.push(record.redo);
            undoList.push(record.undo);
        }
        let redo = () => {
            for (let func of redoList) {
                func();
            }
        };
        let undo = () => {
            for (let func of undoList) {
                func();
            }
        };

        const hash = this.currentFrameRecords.map(record => record.hash).sort().join('@');
        if (this.enableMerge) {
            for (; this.undoStack.length;) {
                const top = this.undoStack[this.undoStack.length - 1];
                if (top.hash === hash) {
                    undo = top.undo;
                    this.undoStack.pop();
                } else {
                    break;
                }
            }
        }
        this.enableMerge = true;

        this.undoStack.push({hash, redo, undo});

        if (this.undoStack.length >= MAX_STACK_SIZE) {
            this.undoStack.shift();
        }

        this.currentFrameRecords.length = 0;
        this.dirty = true;
    }

    undo() {
        const record = this.undoStack.pop();
        if (!record) {
            return;
        }
        this.redoStack.push(record);
        this.model.selected = [];
        record.undo();
        this.dirty = true;
    }

    redo() {
        const record = this.redoStack.pop();
        if (!record) {
            return;
        }
        this.undoStack.push(record);
        record.redo();
        this.dirty = true;
    }

    private getNextNodeId() {
        if (this.nextNodeId) {
            return this.nextNodeId + 1;
        }
        let id = 0;
        this.model.forEach(node => {
            id = Math.max(id, node.id);
        });
        return id + 1;
    }

    createNode(nodeJson: ModelNodeJson) {
        const nodeId = this.getNextNodeId();
        this.currentFrameRecords.push({
            hash: '$createNode',
            redo: () => {
                let nextNodeId = nodeId;
                // expand parents
                if (nodeJson.parentId) {
                    let parent: ModelNode | null = this.model.getNode(nodeJson.parentId);
                    for (; parent; parent = parent.parent) {
                        parent.expanded = true;
                    }
                }
                // create node
                const node = this.model.createNode(
                    nextNodeId++,
                    nodeJson.type,
                    nodeJson.parentId ? this.model.getNode(nodeJson.parentId) : null,
                    null,
                    nodeJson.data
                );
                this.model.addSelection(node.id);
                // create children
                if (nodeJson.children) {
                    const stack: [ModelNode, ModelNodeChildJson[]][] = [[node, nodeJson.children]];
                    for (; ;) {
                        const pair = stack.pop();
                        if (!pair) {
                            break;
                        }
                        const parent = pair[0];
                        const children = pair[1];
                        for (let json of children) {
                            const node = this.model.createNode(
                                nextNodeId++,
                                json.type,
                                parent,
                                null,
                                json.data
                            );
                            this.model.addSelection(node.id);
                            if (json.children) {
                                stack.push([node, json.children]);
                            }
                        }
                    }
                }
            },
            undo: () => {
                this.model.removeNode(nodeId);
            },
        });
        this.enableMerge = false;
        this.nextNodeId = nodeId;
        if (nodeJson.children) {
            const stack: ModelNodeChildJson[] = [...nodeJson.children];
            for (; ;) {
                const child = stack.pop();
                if (!child) {
                    break;
                }
                this.nextNodeId += 1;
                if (child.children) {
                    stack.push(...child.children);
                }
            }
        }
        return nodeId;
    }

    removeNode(nodeId: number) {
        if (!this.model.isNodeExists(nodeId)) {
            return;
        }

        class NodeRecord {
            id: number;
            type: string;
            parentId: number = 0;
            index: number = 0;
            data: { [name: string]: any };
            children: NodeRecord[];

            constructor(node: ModelNode, model: Model) {
                this.id = node.id;
                this.type = node.type;
                if (node.parent) {
                    this.parentId = node.parent.id;
                }
                const list = node.parent ? node.parent.children : model.nodes;
                this.index = list.indexOf(node);
                this.data = node.getComponentsDataJson();
                this.children = node.children.map(child => new NodeRecord(child, model));
            }
        }

        const nodeRecord = new NodeRecord(this.model.getNode(nodeId), this.model);
        this.currentFrameRecords.push({
            hash: '$removeNode',
            redo: () => {
                this.model.removeNode(nodeId);
            },
            undo: () => {
                const node = this.model.createNode(
                    nodeRecord.id,
                    nodeRecord.type,
                    nodeRecord.parentId ? this.model.getNode(nodeRecord.parentId) : null,
                    nodeRecord.index,
                    nodeRecord.data
                );
                this.model.addSelection(node.id);
                const stack: [ModelNode, NodeRecord[]][] = [[node, nodeRecord.children]];
                for (; ;) {
                    const pair = stack.pop();
                    if (!pair) {
                        break;
                    }
                    const parent = pair[0];
                    const children = pair[1];
                    for (let nodeRecord of children) {
                        const node = this.model.createNode(nodeRecord.id, nodeRecord.type, parent, null, nodeRecord.data);
                        this.model.addSelection(node.id);
                        if (nodeRecord.children.length) {
                            stack.push([node, nodeRecord.children]);
                        }
                    }
                }
            },
        });
        this.enableMerge = false;
    }

    moveNode(node: ModelNode,
             parent: ModelNode | null,
             related: ModelNode | null,
             placeAfter: boolean,
             keepTransformUnchanged: boolean
    ) {
        const nodeId = node.id;
        const parentId1 = parent ? parent.id : 0;
        const relatedId1 = related ? related.id : 0;
        const placeAfter1 = placeAfter;
        const parentId0 = node.parent ? node.parent.id : 0;
        let relatedId0 = 0;
        let placeAfter0 = false;
        const list = node.parent ? node.parent.children : this.model.nodes;
        const index = list.indexOf(node);
        if (index > 0) {
            relatedId0 = list[index - 1].id;
            placeAfter0 = true;
        }
        this.currentFrameRecords.push({
            hash: '$moveNode',
            redo: () => {
                this.model.moveNode(
                    this.model.getNode(nodeId),
                    parentId1 ? this.model.getNode(parentId1) : null,
                    relatedId1 ? this.model.getNode(relatedId1) : null,
                    placeAfter1
                );
            },
            undo: () => {
                this.model.moveNode(
                    this.model.getNode(nodeId),
                    parentId0 ? this.model.getNode(parentId0) : null,
                    relatedId0 ? this.model.getNode(relatedId0) : null,
                    placeAfter0
                );
                this.model.addSelection(nodeId);
            },
        });
        this.enableMerge = false;

        if (keepTransformUnchanged) {
            if (parentId0 !== parentId1 && (node.has(CPosition) || node.has(CRotation) || node.has(CScale))) {
                let localMatrix = node.getWorldMatrix();
                if (parent) {
                    localMatrix = new Matrix4().copy(parent.getWorldMatrix()).invert().multiply(localMatrix);
                }
                if (node.has(CPosition)) {
                    const position = new Vector3();
                    const rotation = new Quaternion();
                    const scale = new Vector3();
                    localMatrix.decompose(position, rotation, scale);
                    if (node.has(CPosition)) {
                        this.setValue(node, CPosition, position);
                    }
                    if (node.has(CRotation)) {
                        this.setValue(node, CRotation, new Euler().setFromQuaternion(rotation));
                    }
                    if (node.has(CScale)) {
                        this.setValue(node, CScale, scale.x);
                    }
                }
            }
        }
    }

    setValue<T>(node: ModelNode, componentClass: Class<ModelNodeComponent<T>>, value: T): boolean {
        const nodeId = node.id;
        const oldValue = node.value(componentClass);
        if (oldValue === value) {
            return false;
        }
        const componentDef = getModelNodeComponentDef(componentClass.name);
        if (componentDef.equal) {
            if (componentDef.equal(oldValue, value)) {
                return false;
            }
        }
        const hash = nodeId + '#' + componentClass.name;
        this.currentFrameRecords = this.currentFrameRecords.filter(record => record.hash !== hash);
        this.currentFrameRecords.push({
            hash,
            redo: () => {
                this.model.setValue(this.model.getNode(nodeId), componentClass, value);
            },
            undo: () => {
                this.model.setValue(this.model.getNode(nodeId), componentClass, oldValue);
                this.model.addSelection(nodeId);
            },
        });
        return true;
    }

}
