import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import Class from '../../common/type/Class';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import Model from './Model';
import ModelNode from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeComponentDef} from './ModelNodeComponentDef';

const MAX_STACK_SIZE = 200;

type Record = {
    hash: string;
    redo: () => void;
    undo: () => void;
}

type CreateChildNode = {
    type: string;
    data?: { [name: string]: any };
    children?: CreateChildNode[];
}

type CreateNode = {
    type: string;
    parentId?: number;
    data?: { [name: string]: any };
    children?: CreateChildNode[];
};

export default class ModelHistory {
    private model: Model;
    private enableMergeThisFrame = false;
    private enableMergeNextFrame = true;
    private currentFrameRecords: Record[] = [];
    private redoStack: Record[] = [];
    private undoStack: Record[] = [];
    private nextNodeId: number = 0;
    dirty = false;

    constructor(model: Model) {
        this.model = model;
    }

    clear() {
        this.dirty = false;
        this.currentFrameRecords.length = 0;
        this.redoStack.length = 0;
        this.undoStack.length = 0;
    }

    begin() {
        // todo
    }

    end() {
        // todo
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

    createNode(createNode: CreateNode) {
        const nodeId = this.getNextNodeId();
        this.currentFrameRecords.push({
            hash: '$createNode',
            redo: () => {
                let nextNodeId = nodeId;
                // expand parents
                if (createNode.parentId) {
                    let parent: ModelNode | null = this.model.getNode(createNode.parentId);
                    for (; parent; parent = parent.parent) {
                        parent.expanded = true;
                    }
                }
                // create node
                const node = this.model.createNode(
                    nextNodeId,
                    createNode.type,
                    createNode.parentId ? this.model.getNode(createNode.parentId) : null,
                    null,
                    createNode.data
                );
                this.model.selected.push(node.id);
                // create children
                if (createNode.children) {
                    const stack: [ModelNode, CreateChildNode[]][] = [[node, createNode.children]];
                    for (; ;) {
                        const pair = stack.pop();
                        if (!pair) {
                            break;
                        }
                        const parent = pair[0];
                        const children = pair[1];
                        for (let createNode of children) {
                            const node = this.model.createNode(
                                nextNodeId++,
                                createNode.type,
                                parent,
                                null,
                                createNode.data
                            );
                            if (createNode.children) {
                                stack.push([node, createNode.children]);
                            }
                        }
                    }
                }
            },
            undo: () => {
                this.model.removeNode(nodeId);
            },
        });
        this.enableMergeThisFrame = false;
        this.nextNodeId = nodeId;
        if (createNode.children) {
            const stack: CreateChildNode[] = [...createNode.children];
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
            data: { [name: string]: any } = {};
            children: NodeRecord[];

            constructor(node: ModelNode, model: Model) {
                this.id = node.id;
                this.type = node.type;
                if (node.parent) {
                    this.parentId = node.parent.id;
                }
                const list = node.parent ? node.parent.children : model.nodes;
                this.index = list.indexOf(node);
                for (let componentName in node.components) {
                    const componentDef = getModelNodeComponentDef(componentName);
                    if (componentDef.storable) {
                        const component = node.components[componentName];
                        this.data[componentName] = component.value;
                    }
                }
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
                this.model.selected.push(node.id);
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
                        if (nodeRecord.children.length) {
                            stack.push([node, nodeRecord.children]);
                        }
                    }
                }
            },
        });
        this.enableMergeThisFrame = false;
    }

    moveNode(node: ModelNode, parent: ModelNode | null, related: ModelNode | null, placeAfter: boolean) {
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
        this.enableMergeThisFrame = false;
        // keep world matrix unchanged
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
        this.currentFrameRecords.push({
            hash: nodeId + '#' + componentClass.name,
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
