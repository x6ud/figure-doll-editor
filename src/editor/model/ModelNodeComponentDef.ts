import {Component} from 'vue';
import Class from '../../common/type/Class';
import ModelNodeComponent from './ModelNodeComponent';

export const enum DataType {
    NUMBER = 1,
    STRING = 2,
    BOOLEAN = 3,
    NUMBER_ARRAY = 4,
    BYTES = 5,
}

export type ModelNodeComponentDef = {
    constructor: Class<ModelNodeComponent<any>>;
    storable?: boolean;
    dataType?: DataType;
    instanceable?: boolean;
    equal?: (a: any, b: any) => boolean,
    label?: string;
    inputComponent?: Component;
    inputComponentProps?: { [prop: string]: any };
    clone?: (val: any) => any;
    serialize?: (val: any) => any;
    deserialize?: (val: any) => any;
};

const modelNodeComponentDefs: { [name: string]: ModelNodeComponentDef } = {};

export function registerModelComponent(params: Omit<ModelNodeComponentDef, 'constructor'>) {
    return function (constructor: Class<ModelNodeComponent<any>>) {
        if (!constructor.name.startsWith('C')) {
            throw new Error(`Component class name should be prefixed with "C"`);
        }
        if (params.storable && params.dataType == null) {
            throw new Error(`Component [${constructor.name}] missing data type`);
        }
        modelNodeComponentDefs[constructor.name] = Object.assign({constructor}, params) as ModelNodeComponentDef;
    };
}

export function isModelNodeComponentDefExists(name: string) {
    return !!modelNodeComponentDefs[name];
}

export function getModelNodeComponentDef(name: string): ModelNodeComponentDef {
    const ret = modelNodeComponentDefs[name];
    if (!ret) {
        throw new Error(`Component def [${name}] not found`);
    }
    return ret;
}
