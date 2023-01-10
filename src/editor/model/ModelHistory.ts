import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import Class from '../../common/type/Class';
import {getScaleScalar} from '../utils/math';
import CColors from './components/CColors';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import CTube from './components/CTube';
import CVertices from './components/CVertices';
import Model from './Model';
import ModelNode from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeComponentDef} from './ModelNodeComponentDef';

const MAX_STACK_SIZE = 200;

type Record = {
    hash: string;
    redo: () => void;
    undo: () => void;
    setCtx?: (ctx: any) => void;
    getCtx?: () => any;
}

export type ModelNodeChildCreationInfo = {
    type: string;
    instanceId?: number;
    data?: { [name: string]: any };
    children?: ModelNodeChildCreationInfo[];
    expanded?: boolean;
    selected?: boolean;
}

export type ModelNodeCreationInfo = {
    type: string;
    parentId?: number;
    instanceId?: number;
    data?: { [name: string]: any };
    children?: ModelNodeChildCreationInfo[];
    expanded?: boolean;
    selected?: boolean;
};

export default class ModelHistory {
    model: Model;
    /** Whether to merge last 2 records with the same hash in the next frame */
    enableMerge = true;
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
    private deletedNodes = new Set<number>();

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
        let getCtx: (() => any) | undefined = undefined;
        let setCtx: ((ctx: any) => void) | undefined = undefined;
        for (let record of this.currentFrameRecords) {
            redoList.push(record.redo);
            undoList.push(record.undo);
            getCtx = getCtx || record.getCtx;
            setCtx = setCtx || record.setCtx;
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

        redo(); // apply modifications

        const hash = this.currentFrameRecords.map(record => record.hash).sort().join('@');
        if (this.enableMerge) {
            for (; this.undoStack.length;) {
                const top = this.undoStack[this.undoStack.length - 1];
                if (top.hash === hash) {
                    if (setCtx && top.getCtx) {
                        setCtx(top.getCtx());
                    } else {
                        undo = top.undo;
                    }
                    this.undoStack.pop();
                } else {
                    break;
                }
            }
        } else {
            const top = this.undoStack[this.undoStack.length - 1];
            if (top && !top.hash.endsWith('!')) {
                top.hash += '!'; // prevent merge
            }
        }
        this.enableMerge = true;

        this.undoStack.push({hash, redo, undo, getCtx: getCtx, setCtx: setCtx});

        if (this.undoStack.length >= MAX_STACK_SIZE) {
            this.undoStack.shift();
        }

        this.deletedNodes.clear();
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

    getNextNodeId() {
        if (this.nextNodeId) {
            return this.nextNodeId + 1;
        }
        let id = 0;
        this.model.forEach(node => {
            id = Math.max(id, node.id);
        });
        return id + 1;
    }

    createNode(nodeJson: ModelNodeCreationInfo) {
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
                    nodeJson.data,
                    nodeJson.instanceId,
                );
                if (nodeJson.expanded != null) {
                    node.expanded = nodeJson.expanded;
                }
                if (nodeJson.selected == null || nodeJson.selected) {
                    this.model.addSelection(node.id);
                }
                // create children
                if (nodeJson.children) {
                    const stack: [ModelNode, ModelNodeChildCreationInfo[]][] = [[node, nodeJson.children]];
                    for (; ;) {
                        const pair = stack.pop();
                        if (!pair) {
                            break;
                        }
                        const parent = pair[0];
                        const children = pair[1];
                        for (let childJson of children) {
                            const node = this.model.createNode(
                                nextNodeId++,
                                childJson.type,
                                parent,
                                null,
                                childJson.data,
                                childJson.instanceId,
                            );
                            if (childJson.expanded != null) {
                                node.expanded = childJson.expanded;
                            }
                            if (childJson.selected == null || childJson.selected) {
                                this.model.addSelection(node.id);
                            }
                            if (childJson.children) {
                                stack.push([node, childJson.children]);
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
            const stack: ModelNodeChildCreationInfo[] = [...nodeJson.children];
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
        if (this.deletedNodes.has(nodeId)) {
            return;
        }

        class NodeRecord {
            id: number;
            type: string;
            expanded: boolean;
            parentId: number = 0;
            instanceId: number = 0;
            index: number = 0;
            data: { [name: string]: any };
            children: NodeRecord[];

            constructor(node: ModelNode, model: Model) {
                this.id = node.id;
                this.type = node.type;
                this.expanded = node.expanded;
                if (node.parent) {
                    this.parentId = node.parent.id;
                }
                this.instanceId = node.instanceId;
                const list = node.parent ? node.parent.children : model.nodes;
                this.index = list.indexOf(node);
                this.data = node.getComponentData();
                this.children = node.children.map(child => new NodeRecord(child, model));
            }
        }

        const nodeRecord = new NodeRecord(this.model.getNode(nodeId), this.model);
        const stack: NodeRecord[] = [nodeRecord];
        while (stack.length) {
            const record = stack.pop();
            if (!record) {
                break;
            }
            this.deletedNodes.add(record.id);
            stack.push(...record.children);
        }
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
                    nodeRecord.data,
                    nodeRecord.instanceId,
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
                        const node = this.model.createNode(
                            nodeRecord.id,
                            nodeRecord.type,
                            parent,
                            null,
                            nodeRecord.data,
                            nodeRecord.instanceId,
                        );
                        node.expanded = nodeRecord.expanded;
                        this.model.addSelection(node.id);
                        if (nodeRecord.children.length) {
                            stack.push([node, nodeRecord.children]);
                        }
                    }
                }
            },
        });
        this.enableMerge = false;

        // delete related shadow nodes
        const refs = this.model.referenceMap.get(nodeId);
        if (refs) {
            for (let id of refs) {
                this.removeNode(id);
            }
        }
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

        if (keepTransformUnchanged && parentId0 !== parentId1) {
            if (node.has(CPosition) || node.has(CRotation) || node.has(CScale)) {
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
            } else if (node.has(CTube)) {
                let detMat = node.getWorldMatrix();
                if (parent) {
                    detMat = new Matrix4().copy(parent.getWorldMatrix()).invert().multiply(detMat);
                }
                const scale = getScaleScalar(detMat);
                const tube = node.get(CTube).clone();
                for (let node of tube) {
                    node.position.applyMatrix4(detMat);
                    node.radius *= scale;
                }
                this.setValue(node, CTube, tube);
            }
        }
    }

    setValue<T>(node: ModelNode, componentClass: Class<ModelNodeComponent<T>>, value: T, hash?: string): boolean {
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
        hash = nodeId + '#' + (hash || componentClass.name);
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

    updateVertices(node: ModelNode, componentClass: Class<CVertices | CColors>, indices: number[], data: Float32Array) {
        if (!indices.length) {
            return false;
        }
        const nodeId = node.id;
        const vertices = node.value(componentClass);
        let oldData = new Float32Array(data.length);
        for (let j = 0, len = indices.length; j < len; ++j) {
            const i = indices[j];
            for (let c = 0; c < 3; ++c) {
                oldData[j * 3 + c] = vertices[i * 3 + c];
            }
        }
        let oldIndices = indices;
        let newIndices = indices;
        let newData = data;

        const hash = nodeId + '#' + componentClass.name;
        this.currentFrameRecords = this.currentFrameRecords.filter(record => record.hash !== hash);
        this.currentFrameRecords.push({
            hash,
            redo: () => {
                this.model.updateVertices(this.model.getNode(nodeId), componentClass, newIndices, newData);
            },
            undo: () => {
                this.model.updateVertices(this.model.getNode(nodeId), componentClass, oldIndices, oldData);
                this.model.addSelection(nodeId);
            },
            setCtx: ([oldIndices0, oldData0, newIndices0, newData0]: [number[], Float32Array, number[], Float32Array]) => {
                // undo ctx
                {
                    // merge original positions/colors of modified vertices
                    // keep only the oldest
                    const allChangedIndices = new Set([...oldIndices0, ...oldIndices]);
                    const oldData1 = new Float32Array(allChangedIndices.size * 3);
                    for (let i = 0, len = oldData0.length; i < len; ++i) {
                        oldData1[i] = oldData0[i];
                    }
                    const oldIndices1 = [...oldIndices0];
                    const existed = new Set(oldIndices0);
                    let offset = oldData0.length;
                    for (let j = 0, len = oldIndices.length; j < len; ++j) {
                        const i = oldIndices[j];
                        if (!existed.has(i)) {
                            oldIndices1.push(i);
                            for (let c = 0; c < 3; ++c) {
                                oldData1[offset + c] = oldData[j * 3 + c];
                            }
                            offset += 3;
                        }
                    }
                    oldIndices = oldIndices1;
                    oldData = oldData1;
                }

                // redo ctx
                {
                    // merge new positions/colors of modified vertices
                    // discard old ones for repetitive
                    const allChangedIndices = new Set([...newIndices, ...newIndices0]);
                    const newData1 = new Float32Array(allChangedIndices.size * 3);
                    for (let i = 0, len = newData.length; i < len; ++i) {
                        newData1[i] = newData[i];
                    }
                    const newIndices1 = [...newIndices];
                    const existed = new Set(newIndices);
                    let offset = newData.length;
                    for (let j = 0, len = newIndices0.length; j < len; ++j) {
                        const i = newIndices0[j];
                        if (!existed.has(i)) {
                            newIndices1.push(i);
                            for (let c = 0; c < 3; ++c) {
                                newData1[offset + c] = newData0[j * 3 + c];
                            }
                            offset += 3;
                        }
                    }
                    newIndices = newIndices1;
                    newData = newData1;
                }
            },
            getCtx: () => {
                return [oldIndices, oldData, newIndices, newData];
            },
        });
        return true;
    }

}
