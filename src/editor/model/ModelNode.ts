import {BufferGeometry, Matrix4} from 'three';
import Class from '../type/Class';
import {bufferToDataUrl} from '../utils/convert';
import CObject3D from './components/CObject3D';
import ModelNodeComponent from './ModelNodeComponent';
import {DataType, getModelNodeComponentDef} from './ModelNodeComponentDef';
import {getValidChildNodeDefs} from './ModelNodeDef';

const UNIT_MAT4 = new Matrix4();

type ModelNodeJsonData = string | number | boolean | number[];

export type ModelNodeChildJson = {
    type: string;
    expanded?: boolean;
    instanceId?: number;
    data?: { [name: string]: ModelNodeJsonData };
    children?: ModelNodeChildJson[];
}

export type ModelNodeJson = {
    type: string;
    expanded?: boolean;
    parentId?: number;
    instanceId?: number;
    data?: { [name: string]: ModelNodeJsonData };
    children?: ModelNodeChildJson[];
};

export default class ModelNode {
    id: number = 0;
    type: string = '';
    expanded: boolean = true;
    components: { [name: string]: ModelNodeComponent<any> } = {};
    parent: ModelNode | null = null;
    children: ModelNode[] = [];
    dirty: boolean = true;
    deleted: boolean = false;
    opacity: number = 1;
    visible: boolean = true;
    /** Node is a shadow node when instance id is not 0. Shadow nodes always copy mesh from instance id target nodes. */
    instanceId: number = 0;
    /** True if shadow node targets mesh changed or updated. */
    instanceMeshDirty: boolean = true;
    /** True if shadow node targets mesh object changed. */
    instanceMeshRebuild: boolean = true;
    /** Cached mirror geometry for shadow nodes. */
    mirrorGeometry: { [hash: string]: BufferGeometry } = {};

    get<T extends ModelNodeComponent<any>>(componentClass: Class<T>): T {
        const component = this.components[componentClass.name];
        if (!component) {
            throw new Error(`Component [${componentClass.name}] not found`);
        }
        return component as T;
    }

    has<T extends ModelNodeComponent<any>>(componentClass: Class<T>): boolean {
        return this.components[componentClass.name] != null;
    }

    /** The return value should be read-only */
    value<T>(componentClass: Class<ModelNodeComponent<T>>): T {
        return this.get(componentClass).value;
    }

    /** The return value is safe to be modified */
    cloneValue<T>(componentClass: Class<ModelNodeComponent<T>>): T {
        const val = this.get(componentClass).value;
        const componentDef = getModelNodeComponentDef(componentClass.name);
        return componentDef.clone ? componentDef.clone(val) : val;
    }

    /** Iterate over this node and all child nodes. Retuning false in callback to break the loop. */
    forEach(callback: (node: ModelNode) => void | boolean): void | boolean {
        const stack: ModelNode[] = [this];
        for (; ;) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            if (callback(node) === false) {
                return false;
            }
            for (let i = node.children.length; i--;) {
                stack.push(node.children[i]);
            }
        }
    }

    /** The return value should be read-only */
    getLocalMatrix(): Matrix4 {
        if (this.has(CObject3D)) {
            const obj = this.value(CObject3D);
            if (obj) {
                return obj.matrix;
            }
        }
        if (this.parent) {
            return this.parent.getLocalMatrix();
        }
        return UNIT_MAT4;
    }

    /** The return value should be read-only */
    getWorldMatrix(): Matrix4 {
        if (this.has(CObject3D)) {
            const obj = this.value(CObject3D);
            if (obj) {
                return obj.matrixWorld;
            }
        }
        if (this.parent) {
            return this.parent.getWorldMatrix();
        }
        return UNIT_MAT4;
    }

    /** The return value should be read-only */
    getParentWorldMatrix(): Matrix4 {
        if (this.type === 'Target') {
            return UNIT_MAT4;
        }
        return this.parent ? this.parent.getWorldMatrix() : UNIT_MAT4;
    }

    /** Return a stringizable object */
    async toJson(): Promise<ModelNodeJson> {
        const children: ModelNodeJson[] = [];
        for (let child of this.children) {
            children.push(await child.toJson());
        }
        return {
            type: this.type,
            expanded: this.expanded,
            parentId: this.parent?.id,
            instanceId: this.instanceId,
            data: await this.getComponentsDataJson(),
            children,
        };
    }

    /** Return a clone of all storable component values */
    getComponentData(instanceableOnly?: boolean): { [name: string]: any } {
        const ret: { [name: string]: any } = {};
        for (let componentName in this.components) {
            const componentDef = getModelNodeComponentDef(componentName);
            if (instanceableOnly && !(componentDef.instanceable || componentDef.autoCopy)) {
                continue;
            }
            if (componentDef.storable) {
                const component = this.components[componentName];
                let val = component.value;
                if (componentDef.clone) {
                    val = componentDef.clone(val);
                }
                ret[componentName] = val;
            }
        }
        return ret;
    }

    /** Return all storable component values converted to stringizable data type */
    async getComponentsDataJson(): Promise<{ [name: string]: ModelNodeJsonData }> {
        const ret: { [name: string]: ModelNodeJsonData } = {};
        for (let componentName in this.components) {
            const componentDef = getModelNodeComponentDef(componentName);
            if (componentDef.storable) {
                const component = this.components[componentName];
                let val = component.value;
                if (componentDef.serialize) {
                    val = componentDef.serialize(val);
                }
                if (val && componentDef.dataType === DataType.BYTES) {
                    val = await bufferToDataUrl(val);
                }
                ret[componentName] = val;
            }
        }
        return ret;
    }

    /** Whether this node can have a child of given type */
    isValidChild(type: string) {
        return !!getValidChildNodeDefs(this).find(def => def.name === type);
    }
}
