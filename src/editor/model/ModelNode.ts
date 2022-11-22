import Class from '../../common/type/Class';
import ModelNodeComponent from './ModelNodeComponent';

export default class ModelNode {
    id: number = 0;
    type: string = '';
    expanded: boolean = true;
    components: { [name: string]: ModelNodeComponent<any> } = {};
    parent: ModelNode | null = null;
    children: ModelNode[] = [];
    dirty: boolean = true;

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
}
