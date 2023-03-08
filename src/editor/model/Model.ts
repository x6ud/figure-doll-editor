import {toRaw} from 'vue';
import Class from '../../common/type/Class';
import CameraConfig from './CameraConfig';
import CColors from './components/CColors';
import CFlipDirection from './components/CFlipDirection';
import CGeom3 from './components/CGeom3';
import CObject3D from './components/CObject3D';
import CVertices from './components/CVertices';
import ModelNode from './ModelNode';
import ModelNodeChangedWatcher from './ModelNodeChangedWatcher';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeComponentDef} from './ModelNodeComponentDef';
import {getModelNodeDef} from './ModelNodeDef';
import BoxWatcher from './watchers/BoxWatcher';
import ClayWatcher from './watchers/ClayWatcher';
import CsgWatcher from './watchers/CsgWatcher';
import IkNodeWatcher from './watchers/IkNodeWatcher';
import ImageWatcher from './watchers/ImageWatcher';
import ImportModelWatcher from './watchers/ImportModelWatcher';
import MaterialWatcher from './watchers/MaterialWatcher';
import OpacityWatcher from './watchers/OpacityWatcher';
import SdfShapeWatcher from './watchers/SdfShapeWatcher';
import TransformWatcher from './watchers/TransformWatcher';

export default class Model {
    /** Id to node map */
    private nodesMap: Map<number, ModelNode> = new Map();

    nodes: ModelNode[] = [];
    cameraFov: number = 45;
    cameraPerspective: boolean = true;
    cameras: CameraConfig[] = [];
    watchers: ModelNodeChangedWatcher[] = [
        new TransformWatcher(),
        new IkNodeWatcher(),
        new OpacityWatcher(),
        new ImageWatcher(),
        new ImportModelWatcher(),
        new BoxWatcher(),
        new SdfShapeWatcher(),
        new CsgWatcher(),
        new ClayWatcher(),
        new MaterialWatcher(),
    ];
    /** True if any node needs to be updated */
    dirty: boolean = true;
    /** True if any shadow node's target mesh changed */
    instanceDirty: boolean = true;
    /** Mapping node id to all shadow node ids that target it */
    referenceMap: Map<number, number[]> = new Map();
    /** Selected node ids */
    selected: number[] = [];

    reset() {
        this.selected = [];
        this.dirty = false;
        this.instanceDirty = false;
        this.referenceMap.clear();
        for (let id of this.nodes.map(node => node.id)) {
            this.removeNode(id);
        }
        this.cameras = [];
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
        data?: { [name: string]: any },
        instanceId?: number,
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
        node.parent = toRaw(parent);
        this.instanceMeshUpdated(id, true);
        if (instanceId) {
            node.instanceId = instanceId;
            if (this.referenceMap.has(instanceId)) {
                this.referenceMap.get(instanceId)!.push(id);
            } else {
                this.referenceMap.set(instanceId, [id]);
            }
            this.instanceDirty = true;
        }
        if (data) {
            for (let name in data) {
                let component = node.components[name];
                if (!component && instanceId && name === CFlipDirection.name) {
                    component = node.components[name] = new CFlipDirection();
                }
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
        if (node.parent) {
            for (let watcher of this.watchers) {
                watcher.onBeforeChildRemoved(this, node.parent, node);
            }
        }
        node.deleted = true;
        this.instanceMeshUpdated(id, true);
        node.forEach(node => {
            if (node.instanceId) {
                const refIds = this.referenceMap.get(node.instanceId);
                if (refIds) {
                    this.referenceMap.set(node.instanceId, refIds.filter(refId => refId !== node.id));
                }
                this.instanceDirty = true;
            }
        });
        for (let hash in node.mirrorGeometry) {
            node.mirrorGeometry[hash]?.dispose();
            delete node.mirrorGeometry[hash];
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
        const def = getModelNodeComponentDef(componentClass.name);
        if (def.autoCopy) {
            const refs = this.referenceMap.get(node.id);
            if (refs) {
                for (let id of refs) {
                    const node = this.getNode(id);
                    node.get(componentClass).value = value;
                    node.dirty = true;
                    for (let watcher of this.watchers) {
                        watcher.onValueChanged(this, node, componentClass);
                    }
                }
            }
        }
    }

    updateVertices(node: ModelNode, componentClass: Class<CVertices | CColors>, indices: number[], data: Float32Array) {
        const component = node.get(componentClass);
        const val = component.value;
        const cObject3D = node.get(CObject3D);
        if (cObject3D.mesh) {
            const mesh = cObject3D.mesh;
            if (componentClass === CVertices) {
                mesh.updateVertices(indices, data);
                for (let i = 0, len = val.length; i < len; ++i) {
                    val[i] = mesh.aPosition[i];
                }
            } else if (componentClass === CColors) {
                mesh.updateColors(indices, data);
                for (let i = 0, len = val.length; i < len; ++i) {
                    val[i] = mesh.aColor[i];
                }
            }
        }
        for (let j = 0, len = indices.length; j < len; ++j) {
            const i = indices[j];
            for (let c = 0; c < 3; ++c) {
                val[i * 3 + c] = data[j * 3 + c];
            }
        }
        node.dirty = true;
        this.dirty = true;
        component.partialUpdate = true;
        for (let watcher of this.watchers) {
            watcher.onValueChanged(this, node, componentClass);
        }
    }

    instanceMeshUpdated(id: number, rebuild: boolean) {
        const refIds = this.referenceMap.get(id);
        if (refIds) {
            this.instanceDirty = true;
            for (let refId of refIds) {
                if (this.isNodeExists(refId)) {
                    const node = this.getNode(refId);
                    node.instanceMeshDirty = true;
                    node.instanceMeshRebuild = rebuild;
                    if (node.has(CGeom3)) {
                        let parent = node.parent;
                        while (parent) {
                            if (!parent.instanceId && parent.has(CGeom3)) {
                                this.dirty = true;
                                parent.dirty = true;
                                const cGeom3 = parent.get(CGeom3);
                                cGeom3.dirty = true;
                                parent = parent.parent;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
        }
        if (this.isNodeExists(id)) {
            const node = this.getNode(id);
            for (let hash in node.mirrorGeometry) {
                if (rebuild) {
                    node.mirrorGeometry[hash]?.dispose();
                }
                delete node.mirrorGeometry[hash];
            }
        }
    }
}
