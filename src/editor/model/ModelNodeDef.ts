import Class from '../../common/type/Class';
import CObject3D from './components/CObject3D';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import ModelNodeComponent from './ModelNodeComponent';

export type ModelNodeDef = {
    name: string;
    label: string;
    components: Class<ModelNodeComponent<any>>[];
    canBeRoot: boolean;
    unique: boolean;
    validChildTypes: string[];
};

export const modelNodeDefs: ModelNodeDef[] = [
    {
        name: 'container',
        label: 'Container',
        components: [CPosition, CRotation, CScale, CObject3D],
        canBeRoot: true,
        unique: false,
        validChildTypes: [],
    }
];

const modelNodeDefMap: { [name: string]: ModelNodeDef } = {};
for (let def of modelNodeDefs) {
    modelNodeDefMap[def.name] = def;
}

export function getModelNodeDef(name: string): ModelNodeDef {
    const def = modelNodeDefMap[name];
    if (!def) {
        throw new Error(`Node def [${name}] not found`);
    }
    return def;
}
