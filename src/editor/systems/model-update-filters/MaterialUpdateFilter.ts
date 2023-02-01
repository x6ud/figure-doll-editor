import {Mesh, MeshStandardMaterial} from 'three';
import EditorContext from '../../EditorContext';
import CColor from '../../model/components/CColor';
import CEmissive from '../../model/components/CEmissive';
import CMetalness from '../../model/components/CMetalness';
import CObject3D from '../../model/components/CObject3D';
import CRoughness from '../../model/components/CRoughness';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class MaterialUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.instanceId) {
            return;
        }
        if (node.has(CObject3D)) {
            const mesh = node.value(CObject3D) as Mesh;
            if (!mesh) {
                return;
            }
            if (!mesh.isMesh) {
                return;
            }
            const material = mesh.material as MeshStandardMaterial;
            if (!material?.isMeshStandardMaterial) {
                return;
            }
            if (node.has(CColor)) {
                const color = node.value(CColor);
                material.color.setRGB(color[0], color[1], color[2]);
            }
            if (node.has(CEmissive)) {
                const emissive = node.value(CEmissive);
                material.emissive.setRGB(emissive[0], emissive[1], emissive[2]);
            }
            if (node.has(CRoughness)) {
                material.roughness = node.value(CRoughness);
            }
            if (node.has(CMetalness)) {
                material.metalness = node.value(CMetalness);
            }
        }
    }
}
