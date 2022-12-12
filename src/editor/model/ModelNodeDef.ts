import Class from '../../common/type/Class';
import CBoxSize from './components/CBoxSize';
import CImage from './components/CImage';
import CImportFbx from './components/CImportFbx';
import CImportObj from './components/CImportObj';
import CName from './components/CName';
import CObject3D from './components/CObject3D';
import COpacity from './components/COpacity';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import CTube from './components/CTube';
import CVisible from './components/CVisible';
import ModelNode from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';

export type ModelNodeDef = {
    name: string;
    label: string;
    components: Class<ModelNodeComponent<any>>[];
    canBeRoot: boolean;
    validChildTypes: string[];
};

export const modelNodeDefs: ModelNodeDef[] = [
    {
        name: 'Container',
        label: 'Container',
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D],
        canBeRoot: true,
        validChildTypes: ['Container', 'Image', 'ObjModel', 'FbxModel', 'Box', 'Tube'],
    },
    {
        name: 'Image',
        label: 'Image',
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CImage],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'ObjModel',
        label: 'OBJ Model',
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CImportObj],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'FbxModel',
        label: 'FBX Model',
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CImportFbx],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Box',
        label: 'Box',
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CBoxSize],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Tube',
        label: 'Tube',
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CTube],
        canBeRoot: true,
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
    return def.validChildTypes.map(getModelNodeDef);
}
