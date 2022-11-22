import EditorContext from '../../EditorContext';
import CMesh from '../../model/components/CMesh';
import CPosition from '../../model/components/CPosition';
import CRotation from '../../model/components/CRotation';
import CScale from '../../model/components/CScale';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class TransformUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(CMesh)) {
            const cMesh = node.get(CMesh);
            if (cMesh.dirty) {
                const mesh = cMesh.value;
                if (mesh) {
                    if (node.has(CPosition)) {
                        mesh.position.copy(node.value(CPosition));
                    }
                    if (node.has(CRotation)) {
                        mesh.rotation.copy(node.value(CRotation));
                    }
                    if (node.has(CScale)) {
                        mesh.scale.x = mesh.scale.y = mesh.scale.z = node.value(CScale);
                    }
                    mesh.updateMatrixWorld();
                }
                cMesh.dirty = false;
            }
        }
    }
}
