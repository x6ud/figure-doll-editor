import Class from '../../common/type/Class';
import CImage from './components/CImage';
import CName from './components/CName';
import CObject3D from './components/CObject3D';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import CVisible from './components/CVisible';
import ModelNode from './ModelNode';
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
        name: 'Container',
        label: 'Container',
        components: [CName, CVisible, CPosition, CRotation, CScale, CObject3D],
        canBeRoot: true,
        unique: false,
        validChildTypes: ['Container', 'Image'],
    },
    {
        name: 'Image',
        label: 'Image',
        components: [CName, CVisible, CPosition, CRotation, CScale, CObject3D, CImage],
        canBeRoot: true,
        unique: false,
        validChildTypes: [],
    },
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

export function getValidChildNodeDefs(node: ModelNode) {
    const def = getModelNodeDef(node.type);
    return def.validChildTypes
        .map(getModelNodeDef)
        .filter(def => {
            if (def.unique) {
                return !node.children.find(child => child.type === def.name);
            }
            return true;
        });
}
