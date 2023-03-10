import {Euler, Matrix4, Mesh, Object3D, Quaternion, Vector3} from 'three';
import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import CCastShadow from '../model/components/CCastShadow';
import CColor from '../model/components/CColor';
import CColors from '../model/components/CColors';
import CEmissive from '../model/components/CEmissive';
import CMetalness from '../model/components/CMetalness';
import CName from '../model/components/CName';
import CObject3D from '../model/components/CObject3D';
import COpacity from '../model/components/COpacity';
import CPosition from '../model/components/CPosition';
import CReceiveShadow from '../model/components/CReceiveShadow';
import CRotation from '../model/components/CRotation';
import CRoughness from '../model/components/CRoughness';
import CScale from '../model/components/CScale';
import CSymmetry from '../model/components/CSymmetry';
import CVertices from '../model/components/CVertices';
import ModelNode from '../model/ModelNode';
import ModelNodeComponent from '../model/ModelNodeComponent';
import Class from '../type/Class';

const _position = new Vector3();
const _rotation = new Quaternion();
const _scale = new Vector3();
const _invMat = new Matrix4();
const _mat = new Matrix4();

export function convertModelNodeToClay(ctx: EditorContext, node: ModelNode) {
    node = toRaw(node);
    const parent = node.parent;
    if (!node.has(CObject3D)) {
        return;
    }
    const object3D = node.value(CObject3D);
    if (!object3D) {
        return;
    }
    _invMat.copy(node.getParentWorldMatrix()).invert();
    const stack: Object3D[] = [object3D];
    const meshes: Mesh[] = [];
    while (stack.length) {
        const object3D = stack.pop();
        if (!object3D) {
            break;
        }
        const objNode = object3D.userData.node as ModelNode | undefined;
        if (objNode && objNode.id !== node.id) {
            continue;
        }
        if (!object3D.visible) {
            continue;
        }
        if ((object3D as Mesh).isMesh) {
            meshes.push(object3D as Mesh);
        }
        stack.push(...object3D.children);
    }
    for (let mesh of meshes) {
        const geometry = mesh.geometry;
        const vertices: number[] = [];
        let colors: number[] | null = null;
        if (geometry.index) {
            const aPos = geometry.getAttribute('position');
            if (aPos?.itemSize !== 3) {
                continue;
            }
            const indices = geometry.index.array;
            const arrPos = aPos.array;
            for (let j = 0, len = indices.length; j < len; ++j) {
                const i = indices[j];
                const k = i * 3;
                vertices.push(arrPos[k], arrPos[k + 1], arrPos[k + 2]);
            }
            const aCol = geometry.getAttribute('color');
            if (aCol) {
                const arrCol = aCol.array;
                colors = [];
                for (let j = 0, len = indices.length, step = aCol.itemSize; j < len; ++j) {
                    const i = indices[j];
                    const k = i * step;
                    colors.push(arrCol[k], arrCol[k + 1], arrCol[k + 2]);
                }
            }
        } else {
            const aPos = geometry.getAttribute('position');
            if (aPos?.itemSize !== 3) {
                continue;
            }
            const arrPos = aPos.array;
            for (let i = 0, len = arrPos.length; i < len; i += 3) {
                vertices.push(arrPos[i], arrPos[i + 1], arrPos[i + 2]);
            }
            const aCol = geometry.getAttribute('color');
            if (aCol) {
                colors = [];
                const arrCol = aCol.array;
                for (let i = 0, len = arrCol.length, step = aCol.itemSize; i < len; i += step) {
                    colors.push(arrCol[i], arrCol[i + 1], arrCol[i + 2]);
                }
            }
        }
        if (!vertices.length) {
            continue;
        }
        const data: { [name: string]: any } = {};
        data[CVertices.name] = new Float32Array(vertices);
        if (colors) {
            data[CColors.name] = new Float32Array(colors);
        }
        const classes: Class<ModelNodeComponent<any>>[] = [
            CName, CCastShadow, CReceiveShadow,
            CRoughness, CMetalness, CColor, CEmissive, COpacity, CSymmetry,
        ];
        for (let componentClass of classes) {
            if (node.has(componentClass)) {
                data[componentClass.name] = node.cloneValue(componentClass);
            }
        }
        mesh.updateWorldMatrix(true, false);
        _mat.copy(mesh.matrixWorld);
        _mat.multiplyMatrices(_invMat, _mat);
        _mat.decompose(_position, _rotation, _scale);
        _rotation.identity();
        data[CPosition.name] = new Vector3().copy(_position);
        data[CRotation.name] = new Euler().setFromQuaternion(_rotation);
        data[CScale.name] = _scale.x;
        ctx.history.createNode({type: 'Clay', parentId: parent?.id, data});
    }
    ctx.history.removeNode(node.id);
}
