import Class from '../../common/type/Class';
import CBoxSize from './components/CBoxSize';
import CIkNode from './components/CIkNode';
import CIkNodeLength from './components/CIkNodeLength';
import CIkNodeRotation from './components/CIkNodeRotation';
import CImage from './components/CImage';
import CImportFbx from './components/CImportFbx';
import CImportObj from './components/CImportObj';
import CName from './components/CName';
import CObject3D from './components/CObject3D';
import COpacity from './components/COpacity';
import CPosition from './components/CPosition';
import CRotation from './components/CRotation';
import CScale from './components/CScale';
import CSdfDirty from './components/CSdfDirty';
import CSdfOperator from './components/CSdfOperator';
import CSdfSymmetry from './components/CSdfSymmetry';
import CTube from './components/CTube';
import CVertices from './components/CVertices';
import CVisible from './components/CVisible';
import iconBox from './icons/Box.png';
import iconClay from './icons/Clay.png';
import iconContainer from './icons/Container.png';
import iconFbxModel from './icons/FbxModel.png';
import iconIKChain from './icons/IKChain.png';
import iconIKNode from './icons/IKNode.png';
import iconImage from './icons/Image.png';
import iconObjModel from './icons/ObjModel.png';
import iconShape from './icons/Shape.png';
import iconTube from './icons/Tube.png';
import ModelNode from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';

export type ModelNodeDef = {
    name: string;
    label: string;
    icon: string;
    components: Class<ModelNodeComponent<any>>[];
    canBeRoot: boolean;
    validChildTypes: string[];
};

export const modelNodeDefs: ModelNodeDef[] = [
    {
        name: 'Container',
        label: 'Container',
        icon: iconContainer,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D],
        canBeRoot: true,
        validChildTypes: ['Container', 'IKChain', 'Image', 'ObjModel', 'FbxModel', 'Box', 'Shape', 'Clay'],
    },
    {
        name: 'IKChain',
        label: 'IK Chain',
        icon: iconIKChain,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D],
        canBeRoot: true,
        validChildTypes: ['IKNode'],
    },
    {
        name: 'IKNode',
        label: 'IK Node',
        icon: iconIKNode,
        components: [CName, CVisible, COpacity, CObject3D, CIkNode, CIkNodeLength, CIkNodeRotation],
        canBeRoot: false,
        validChildTypes: ['Container', 'IKChain', 'Image', 'ObjModel', 'FbxModel', 'Box', 'Shape', 'Clay'],
    },
    {
        name: 'Box',
        label: 'Box',
        icon: iconBox,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CBoxSize],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Shape',
        label: 'SDF Shape',
        icon: iconShape,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CSdfDirty, CSdfSymmetry],
        canBeRoot: true,
        validChildTypes: ['Tube'],
    },
    {
        name: 'Tube',
        label: 'Tube',
        icon: iconTube,
        components: [CName, CObject3D, CSdfOperator, CTube],
        canBeRoot: false,
        validChildTypes: [],
    },
    {
        name: 'Clay',
        label: 'Clay',
        icon: iconClay,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CVertices],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Image',
        label: 'Image',
        icon: iconImage,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CImage],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'ObjModel',
        label: 'Import .obj',
        icon: iconObjModel,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CImportObj],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'FbxModel',
        label: 'Import .fbx',
        icon: iconFbxModel,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CImportFbx],
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
