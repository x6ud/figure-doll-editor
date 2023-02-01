import {Vector3} from 'three';
import Class from '../../common/type/Class';
import CBoxSize from './components/CBoxSize';
import CCastShadow from './components/CCastShadow';
import CColor from './components/CColor';
import CColors from './components/CColors';
import CCredit from './components/CCredit';
import CEmissive from './components/CEmissive';
import './components/CFlipDirection';
import CGroundColor from './components/CGroundColor';
import CHeight from './components/CHeight';
import CHingeAngleRange from './components/CHingeAngleRange';
import CHingeAxis from './components/CHingeAxis';
import CIkNode from './components/CIkNode';
import CIkNodeLength from './components/CIkNodeLength';
import CIkNodeRotation from './components/CIkNodeRotation';
import CImage from './components/CImage';
import CImportFbx from './components/CImportFbx';
import CImportObj from './components/CImportObj';
import CImportReadonlyGltf from './components/CImportReadonlyGltf';
import CIntensity from './components/CIntensity';
import CLightHelper from './components/CLightHelper';
import CLockEnd from './components/CLockEnd';
import CMapSize from './components/CMapSize';
import CMetalness from './components/CMetalness';
import CName from './components/CName';
import CObject3D from './components/CObject3D';
import COpacity from './components/COpacity';
import CPenumbra from './components/CPenumbra';
import CPosition from './components/CPosition';
import CReceiveShadow from './components/CReceiveShadow';
import CRotation from './components/CRotation';
import CRoughness from './components/CRoughness';
import CScale from './components/CScale';
import CSdfDirty from './components/CSdfDirty';
import CSdfOperator from './components/CSdfOperator';
import CShadowMappingRange from './components/CShadowMappingRange';
import CShowMoveHandler from './components/CShowMoveHandler';
import CShowRotateHandler from './components/CShowRotateHandler';
import CSkyColor from './components/CSkyColor';
import CSpotLightAngle from './components/CSpotLightAngle';
import CSymmetry from './components/CSymmetry';
import CTextureSize from './components/CTextureSize';
import CTube from './components/CTube';
import CVertices from './components/CVertices';
import CVisible from './components/CVisible';
import CWidth from './components/CWidth';
import iconBox from './icons/Box.png';
import iconClay from './icons/Clay.png';
import iconContainer from './icons/Container.png';
import iconFbxModel from './icons/FbxModel.png';
import iconIKChain from './icons/IKChain.png';
import iconIKNode from './icons/IKNode.png';
import iconImage from './icons/Image.png';
import iconImportModel from './icons/ImportModel.png';
import iconLight from './icons/Light.png';
import iconMirror from './icons/Mirror.png';
import iconObjModel from './icons/ObjModel.png';
import iconShape from './icons/Shape.png';
import iconTarget from './icons/Target.png';
import iconTube from './icons/Tube.png';
import {ModelNodeChildCreationInfo} from './ModelHistory';
import ModelNode from './ModelNode';
import ModelNodeComponent from './ModelNodeComponent';

export type ModelNodeDef = {
    /** A unique name */
    name: string;
    /** Name display in the add new node menu */
    label: string;
    icon: string;
    /** Whether to display in the add new node menu */
    showInList: boolean;
    /** Cannot be moved or deleted */
    fixed?: boolean;
    /** Only one this type of node can exist in each parent node */
    unique?: boolean;
    /** Whether shadow node can be created */
    instanceable?: boolean;
    /** Whether node has mesh */
    mesh?: boolean;
    /** Whether node is light */
    light?: boolean;
    components: Class<ModelNodeComponent<any>>[];
    /** Whether parent can be null */
    canBeRoot: boolean;
    validChildTypes: string[];
    defaultData?: { [name: string]: any };
    defaultChildren?: ModelNodeChildCreationInfo[];
};

export const modelNodeDefs: ModelNodeDef[] = [
    {
        name: 'Container',
        label: 'Container',
        icon: iconContainer,
        showInList: true,
        instanceable: true,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D],
        canBeRoot: true,
        validChildTypes: ['Container', 'IKChain', 'Image', 'ObjModel', 'FbxModel', 'ImportModel', 'Box', 'Shape', 'Clay', 'Mirror', 'AmbientLight', 'HemisphereLight', 'DirectionalLight', 'PointLight', 'SpotLight'],
    },
    {
        name: 'IKChain',
        label: 'IK Chain',
        icon: iconIKChain,
        showInList: true,
        instanceable: true,
        components: [CName, CVisible, CPosition, CRotation, CScale, COpacity, CObject3D, CShowMoveHandler, CLockEnd],
        canBeRoot: true,
        validChildTypes: ['IKNode'],
    },
    {
        name: 'IKNode',
        label: 'IK Node',
        icon: iconIKNode,
        showInList: true,
        instanceable: true,
        components: [CName, CVisible, COpacity, CObject3D, CIkNode, CIkNodeLength, CIkNodeRotation, CShowRotateHandler, CHingeAxis, CHingeAngleRange],
        canBeRoot: false,
        validChildTypes: ['Container', 'IKChain', 'Image', 'ObjModel', 'FbxModel', 'ImportModel', 'Box', 'Shape', 'Clay', 'Mirror', 'AmbientLight', 'HemisphereLight', 'DirectionalLight', 'PointLight', 'SpotLight'],
    },
    {
        name: 'Box',
        label: 'Box',
        icon: iconBox,
        showInList: true,
        instanceable: true,
        mesh: true,
        components: [
            CName,
            CVisible,
            CCastShadow,
            CReceiveShadow,
            CPosition,
            CRotation,
            CScale,
            CColor,
            CEmissive,
            CRoughness,
            CMetalness,
            COpacity,
            CObject3D,
            CBoxSize,
        ],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Shape',
        label: 'SDF Shape',
        icon: iconShape,
        showInList: true,
        instanceable: true,
        mesh: true,
        components: [
            CName,
            CVisible,
            CCastShadow,
            CReceiveShadow,
            CPosition,
            CRotation,
            CScale,
            CColor,
            CEmissive,
            CRoughness,
            CMetalness,
            COpacity,
            CObject3D,
            CSdfDirty,
            CSymmetry,
        ],
        canBeRoot: true,
        validChildTypes: ['Tube'],
    },
    {
        name: 'Tube',
        label: 'Tube',
        icon: iconTube,
        showInList: true,
        components: [CName, CObject3D, CSdfOperator, CTube],
        canBeRoot: false,
        validChildTypes: [],
    },
    {
        name: 'Clay',
        label: 'Clay',
        icon: iconClay,
        showInList: true,
        instanceable: true,
        mesh: true,
        components: [
            CName,
            CVisible,
            CCastShadow,
            CReceiveShadow,
            CPosition,
            CRotation,
            CScale,
            CRoughness,
            CMetalness,
            CColor,
            CEmissive,
            COpacity,
            CObject3D,
            CVertices,
            CColors,
            CSymmetry,
        ],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Image',
        label: 'Image',
        icon: iconImage,
        showInList: true,
        instanceable: true,
        mesh: true,
        components: [CName, CVisible, CCastShadow, CReceiveShadow, CPosition, CRotation, CScale, COpacity, CObject3D, CImage],
        canBeRoot: true,
        defaultData: {
            [CCastShadow.name]: false,
            [CReceiveShadow.name]: false
        },
        validChildTypes: [],
    },
    {
        name: 'ObjModel',
        label: 'Import .obj',
        icon: iconObjModel,
        showInList: true,
        instanceable: true,
        mesh: true,
        components: [
            CName, CVisible, CCastShadow, CReceiveShadow,
            CPosition, CRotation, CScale,
            COpacity, CObject3D, CImportObj
        ],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'FbxModel',
        label: 'Import .fbx',
        icon: iconFbxModel,
        showInList: true,
        instanceable: true,
        mesh: true,
        components: [
            CName, CVisible, CCastShadow, CReceiveShadow,
            CPosition, CRotation, CScale,
            COpacity, CObject3D, CImportFbx
        ],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'ImportModel',
        label: 'Import Model',
        icon: iconImportModel,
        showInList: false,
        instanceable: true,
        mesh: true,
        components: [
            CCredit,
            CName, CVisible, CCastShadow, CReceiveShadow, CPosition, CRotation, CScale, COpacity, CObject3D,
            CImportReadonlyGltf,
        ],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Mirror',
        label: 'Mirror',
        icon: iconMirror,
        showInList: true,
        mesh: true,
        components: [CName, CVisible, CTextureSize, CPosition, CRotation, CScale, CObject3D, CWidth, CHeight, CColor],
        canBeRoot: true,
        validChildTypes: [],
    },
    {
        name: 'Target',
        label: 'Target',
        icon: iconTarget,
        showInList: false,
        instanceable: true,
        fixed: true,
        unique: true,
        components: [CPosition, CObject3D],
        canBeRoot: false,
        validChildTypes: [],
    },
    {
        name: 'AmbientLight',
        label: 'Ambient Light',
        icon: iconLight,
        showInList: true,
        instanceable: true,
        light: true,
        components: [CName, CVisible, CObject3D, CIntensity, CColor],
        canBeRoot: true,
        defaultData: {[CIntensity.name]: 0.2},
        validChildTypes: [],
    },
    {
        name: 'HemisphereLight',
        label: 'Hemisphere Light',
        icon: iconLight,
        showInList: true,
        instanceable: true,
        light: true,
        components: [CName, CVisible, CPosition, CObject3D, CLightHelper, CIntensity, CSkyColor, CGroundColor],
        canBeRoot: true,
        validChildTypes: [],
        defaultData: {[CIntensity.name]: 0.2, [CPosition.name]: new Vector3(0, 1, 0)},
    },
    {
        name: 'DirectionalLight',
        label: 'Directional Light',
        icon: iconLight,
        showInList: true,
        instanceable: true,
        light: true,
        components: [CName, CVisible, CCastShadow, CMapSize, CShadowMappingRange, CPosition, CObject3D, CLightHelper, CIntensity, CColor],
        canBeRoot: true,
        validChildTypes: ['Target'],
        defaultData: {[CPosition.name]: new Vector3(0, 1, 0)},
        defaultChildren: [{type: 'Target', selected: false}],
    },
    {
        name: 'PointLight',
        label: 'Point Light',
        icon: iconLight,
        showInList: true,
        instanceable: true,
        light: true,
        components: [CName, CVisible, CCastShadow, CMapSize, CPosition, CObject3D, CLightHelper, CIntensity, CColor],
        canBeRoot: true,
        validChildTypes: [],
        defaultData: {[CPosition.name]: new Vector3(0, 1, 0)},
    },
    {
        name: 'SpotLight',
        label: 'Spot Light',
        icon: iconLight,
        showInList: true,
        instanceable: true,
        light: true,
        components: [
            CName, CVisible,
            CCastShadow, CMapSize, CPenumbra, CSpotLightAngle,
            CPosition, CObject3D, CLightHelper, CIntensity, CColor],
        canBeRoot: true,
        validChildTypes: ['Target'],
        defaultData: {[CPosition.name]: new Vector3(0, 1, 0)},
        defaultChildren: [{type: 'Target', selected: false}],
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
    return def.validChildTypes.map(getModelNodeDef).filter(def => {
        if (def.unique) {
            return !node.children.find(child => child.type === def.name);
        }
        return true;
    });
}
