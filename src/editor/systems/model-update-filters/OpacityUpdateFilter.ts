import {Mesh, Object3D} from 'three';
import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import COpacity from '../../model/components/COpacity';
import ModelNode from '../../model/ModelNode';
import {getModelNodeDef} from '../../model/ModelNodeDef';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

function setOpacity(obj: Object3D, opacity: number) {
    const mesh = obj as Mesh;
    if (mesh.isMesh) {
        if (Array.isArray(mesh.material)) {
            for (let material of mesh.material) {
                if (material.opacity !== opacity) {
                    material.opacity = opacity;
                    material.transparent = material.opacity < 1;
                    material.needsUpdate = true;
                }
            }
        } else {
            if (mesh.material.opacity !== opacity) {
                mesh.material.opacity = opacity;
                mesh.material.transparent = mesh.material.opacity < 1;
                mesh.material.needsUpdate = true;
            }
        }
    }
    for (let child of obj.children) {
        setOpacity(child, opacity);
    }
}

export default class OpacityUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.instanceId) {
            return;
        }
        node.opacity = (node.parent ? node.parent.opacity : 1)
            * (node.has(COpacity) ? node.value(COpacity) : 1);
        const hasMesh = getModelNodeDef(node.type).mesh;
        if (hasMesh) {
            const cObject3D = node.get(CObject3D);
            if (cObject3D.value) {
                setOpacity(cObject3D.value, node.opacity);
            }
        }
    }
}
