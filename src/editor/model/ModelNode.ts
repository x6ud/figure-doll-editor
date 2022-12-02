import {Matrix4} from 'three';
import Class from '../../common/type/Class';
import CObject3D from './components/CObject3D';
import ModelNodeComponent from './ModelNodeComponent';
import {getModelNodeComponentDef} from './ModelNodeComponentDef';

const UNIT_MAT4 = new Matrix4();

export type ModelNodeChildJson = {
    type: string;
    data?: { [name: string]: any };
    children?: ModelNodeChildJson[];
}

export type ModelNodeJson = {
    type: string;
    parentId?: number;
    data?: { [name: string]: any };
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

    value<T>(componentClass: Class<ModelNodeComponent<T>>): T {
        return this.get(componentClass).value;
    }

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
            stack.push(...node.children);
        }
    }

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

    toJson(): ModelNodeJson {
        return {
            type: this.type,
            parentId: this.parent?.id,
            data: this.getDataJson(),
            children: this.children.map(node => node.toJson())
        };
    }

    getDataJson(): { [name: string]: any } {
        const ret: { [name: string]: any } = {};
        for (let componentName in this.components) {
            const componentDef = getModelNodeComponentDef(componentName);
            if (componentDef.storable) {
                const component = this.components[componentName];
                ret[componentName] = componentDef.clone ? componentDef.clone(component.value) : component.value;
            }
        }
        return ret;
    }
}
