import {BufferGeometry, Mesh, Vector3} from 'three';
import {toRaw} from 'vue';
import Class from '../../common/type/Class';
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
import CSdfDirty from '../model/components/CSdfDirty';
import CSymmetry from '../model/components/CSymmetry';
import CVertices from '../model/components/CVertices';
import ModelNode from '../model/ModelNode';
import ModelNodeComponent from '../model/ModelNodeComponent';

export function convertModelNodeToClay(ctx: EditorContext, node: ModelNode) {
    node = toRaw(node);
    const parent = node.parent;
    let verticesArr: Float32Array[] = [];
    let colorsArr: (Float32Array | null)[] = [];
    switch (node.type) {
        case 'Shape': {
            const cSdfDirty = node.get(CSdfDirty);
            if (cSdfDirty.throttleHash) {
                const task = ctx.throttleTasks.get(cSdfDirty.throttleHash);
                if (task) {
                    task.callback();
                    ctx.throttleTasks.delete(cSdfDirty.throttleHash);
                }
                cSdfDirty.throttleHash = '';
            }
            const mesh = node.value(CObject3D) as Mesh;
            const geometry = mesh.geometry;
            verticesArr = [new Float32Array(geometry.getAttribute('position').array)];
            if (geometry.hasAttribute('color')) {
                colorsArr = [new Float32Array(geometry.getAttribute('color').array)];
            } else {
                colorsArr = [null];
            }
        }
            break;
        default: {
            if (!node.has(CObject3D)) {
                return;
            }
            const mesh = node.value(CObject3D);
            if (!mesh) {
                return;
            }
            const geometries: BufferGeometry[] = [];
            if ((mesh as Mesh).geometry) {
                geometries.push((mesh as Mesh).geometry);
            } else {
                for (let child of mesh.children) {
                    if ((child as Mesh).geometry) {
                        geometries.push((child as Mesh).geometry);
                    }
                }
            }
            const _a = new Vector3();
            const _b = new Vector3();
            const _c = new Vector3();
            for (let geometry of geometries) {
                if (!geometry.isBufferGeometry) {
                    continue;
                }
                const attrPos = geometry.getAttribute('position');
                if (!attrPos) {
                    continue;
                }
                const index = geometry.index;
                if (index) {
                    const vertices = new Float32Array(index.count * 3);
                    const colors = new Float32Array(index.count * 3);
                    for (let i = 0, len = index.count; i < len; i += 3) {
                        _a.fromBufferAttribute(attrPos, index.getX(i));
                        _b.fromBufferAttribute(attrPos, index.getX(i + 1));
                        _c.fromBufferAttribute(attrPos, index.getX(i + 2));
                        const j = i * 3;
                        vertices[j] = _a.x;
                        vertices[j + 1] = _a.y;
                        vertices[j + 2] = _a.z;
                        vertices[j + 3] = _b.x;
                        vertices[j + 4] = _b.y;
                        vertices[j + 5] = _b.z;
                        vertices[j + 6] = _c.x;
                        vertices[j + 7] = _c.y;
                        vertices[j + 8] = _c.z;
                    }
                    if (geometry.hasAttribute('color')) {
                        const attrColor = geometry.getAttribute('color');
                        for (let i = 0, len = index.count; i < len; i += 3) {
                            _a.fromBufferAttribute(attrColor, index.getX(i));
                            _b.fromBufferAttribute(attrColor, index.getX(i + 1));
                            _c.fromBufferAttribute(attrColor, index.getX(i + 2));
                            const j = i * 3;
                            colors[j] = _a.x;
                            colors[j + 1] = _a.y;
                            colors[j + 2] = _a.z;
                            colors[j + 3] = _b.x;
                            colors[j + 4] = _b.y;
                            colors[j + 5] = _b.z;
                            colors[j + 6] = _c.x;
                            colors[j + 7] = _c.y;
                            colors[j + 8] = _c.z;
                        }
                    } else {
                        for (let i = 0, len = colors.length; i < len; ++i) {
                            colors[i] = 1;
                        }
                    }
                    if (vertices.length) {
                        verticesArr.push(vertices);
                        colorsArr.push(colors);
                    }
                } else {
                    if (attrPos.array.length) {
                        verticesArr.push(new Float32Array(attrPos.array));
                        if (geometry.hasAttribute('color')) {
                            const attrColor = geometry.getAttribute('color');
                            colorsArr.push(new Float32Array(attrColor.array));
                        } else {
                            colorsArr.push(null);
                        }
                    }
                }
            }
        }
            break;
    }
    if (!verticesArr.length) {
        return;
    }
    for (let i = 0, len = verticesArr.length; i < len; ++i) {
        const vertices = verticesArr[i];
        const colors = colorsArr[i];
        const data: { [name: string]: any } = {
            [CVertices.name]: vertices,
            [CColors.name]: colors || undefined,
        };
        const classes: Class<ModelNodeComponent<any>>[] = [
            CName, CCastShadow, CReceiveShadow, CPosition, CRotation, CScale,
            CRoughness, CMetalness, CColor, CEmissive, COpacity, CSymmetry,
        ];
        for (let componentClass of classes) {
            if (node.has(componentClass)) {
                data[componentClass.name] = node.cloneValue(componentClass);
            }
        }
        ctx.history.createNode({
            type: 'Clay',
            parentId: parent ? parent.id : 0,
            data,
        });
    }
    ctx.history.removeNode(node.id);
}
