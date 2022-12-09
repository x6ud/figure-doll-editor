import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import CPosition from '../../model/components/CPosition';
import CRotation from '../../model/components/CRotation';
import CScale from '../../model/components/CScale';
import CTube from '../../model/components/CTube';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class TransformUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(CObject3D)) {
            const cObject3D = node.get(CObject3D);
            const mesh = cObject3D.value;
            const edge = cObject3D.edge;
            if (mesh) {
                if (cObject3D.localTransformChanged) {
                    if (node.has(CPosition)) {
                        mesh.position.copy(node.value(CPosition));
                    }
                    if (node.has(CRotation)) {
                        mesh.rotation.copy(node.value(CRotation));
                    }
                    if (node.has(CScale)) {
                        mesh.scale.x = mesh.scale.y = mesh.scale.z = node.value(CScale);
                    }
                    mesh.updateMatrix();
                    if (edge) {
                        edge.matrixAutoUpdate = false;
                        edge.matrix.copy(mesh.matrix);
                    }
                    cObject3D.localTransformChanged = false;
                }
                if (cObject3D.worldTransformChanged) {
                    mesh.updateMatrixWorld(true);
                    if (edge) {
                        edge.updateMatrixWorld();
                    }
                    cObject3D.worldTransformChanged = false;
                    node.forEach(child => {
                        if (child.has(CTube)) {
                            const cTube = child.get(CTube);
                            if (cTube.group) {
                                cTube.group.matrixAutoUpdate = false;
                                cTube.group.matrix.copy(child.getWorldMatrix());
                            }
                        }
                    });
                }
            }
        }
    }
}
