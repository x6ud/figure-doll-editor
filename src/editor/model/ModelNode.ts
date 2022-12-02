import {Matrix4} from 'three';
import Class from '../../common/type/Class';
import CObject3D from './components/CObject3D';
import ModelNodeComponent from './ModelNodeComponent';

const UNIT_MAT4 = new Matrix4();

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

    forEach(callback: (node: ModelNode) => void) {
        const stack: ModelNode[] = [this];
        for (; ;) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            callback(node);
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
}
