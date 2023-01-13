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
    /** Whether component value should be written to file on save */
    storable?: boolean;
    /** Data type when writing to file */
    dataType?: DataType;
    /** Whether to keep an own value in shadow node */
    instanceable?: boolean;
    /** Whether to auto copy the target value to shadow node when the original node is modified */
    autoCopy?: boolean;
    /** Used to skip identical values when writing history */
    equal?: (a: any, b: any) => boolean,
    /** Label display in the properties panel */
    label?: string;
    /** Display label and input component in same line */
    inlineLabel?: boolean;
    inputComponent?: Component;
    inputComponentProps?: { [prop: string]: any };
    clone?: (val: any) => any;
    /** Convert the real value to the data type for writing to file */
    serialize?: (val: any) => any;
    /** Convert the data type read from file into actual object */
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
