import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import CPosition from '../../model/components/CPosition';
import CRotation from '../../model/components/CRotation';
import CScale from '../../model/components/CScale';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class TransformUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(CObject3D)) {
            const cMesh = node.get(CObject3D);
            if (cMesh.transformChanged) {
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
                cMesh.transformChanged = false;
            }
        }
    }
}
