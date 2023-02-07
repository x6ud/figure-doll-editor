import {Material, Mesh, MeshStandardMaterial, Object3D} from 'three';
import EditorContext from '../../EditorContext';
import CColor from '../../model/components/CColor';
import CEmissive from '../../model/components/CEmissive';
import CMetalness from '../../model/components/CMetalness';
import CObject3D from '../../model/components/CObject3D';
import CRoughness from '../../model/components/CRoughness';
import CUsePlainMaterial from '../../model/components/CUsePlainMaterial';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export type BackupMaterial = {
    __originalMaterial?: Material | Material[],
    __plainMaterial?: MeshStandardMaterial,
};

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
            if (node.has(CUsePlainMaterial)) {
                // replace imported model's original material
                const usePlainMaterial = node.value(CUsePlainMaterial);
                node.get(CObject3D).usePlainMaterial = usePlainMaterial;
                const stack: Object3D[] = [mesh];
                while (stack.length) {
                    const object3D = stack.pop();
                    if (!object3D) {
                        break;
                    }
                    const mesh = object3D as (Mesh & BackupMaterial);
                    if (mesh.isMesh) {
                        if (usePlainMaterial) {
                            if (!mesh.__plainMaterial) {
                                mesh.__originalMaterial = mesh.material;
                                mesh.__plainMaterial = new MeshStandardMaterial();
                            }
                            mesh.material = mesh.__plainMaterial;
                            this.updateMaterial(node, mesh.__plainMaterial);
                        } else if (mesh.__originalMaterial) {
                            mesh.material = mesh.__originalMaterial;
                        }
                    }
                    stack.push(...object3D.children);
                }
            } else {
                if (!mesh.isMesh) {
                    return;
                }
                const material = mesh.material as MeshStandardMaterial;
                if (!material?.isMeshStandardMaterial) {
                    return;
                }
                this.updateMaterial(node, material);
            }
        }
    }

    private updateMaterial(node: ModelNode, material: MeshStandardMaterial) {
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
