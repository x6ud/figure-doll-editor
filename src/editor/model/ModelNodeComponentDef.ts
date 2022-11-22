import {Component} from 'vue';
import Class from '../../common/type/Class';
import ModelNodeComponent from './ModelNodeComponent';

export type ModelNodeComponentDef = {
    constructor: Class<ModelNodeComponent<any>>;
    storable?: boolean;
    label?: string;
    inputComponent?: Component;
    inputComponentProps?: { [prop: string]: any };
    serialize?: (val: any) => any;
    deserialize?: (val: any) => any;
};

const modelNodeComponentDefs: { [name: string]: ModelNodeComponentDef } = {};

export function registerModelComponent(params: Omit<ModelNodeComponentDef, 'constructor'>) {
    return function (constructor: Class<ModelNodeComponent<any>>) {
        modelNodeComponentDefs[constructor.name] = Object.assign({constructor}, params) as ModelNodeComponentDef;
    };
}

export function getModelNodeComponentDef(name: string): ModelNodeComponentDef {
    const ret = modelNodeComponentDefs[name];
    if (!ret) {
        throw new Error(`Component def [${name}] not found`);
    }
    return ret;
}
