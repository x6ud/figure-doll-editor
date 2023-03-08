import EditorContext from '../../EditorContext';
import CGeom3 from '../../model/components/CGeom3';
import CIkNode from '../../model/components/CIkNode';
import CObject3D from '../../model/components/CObject3D';
import CPosition from '../../model/components/CPosition';
import CRotation from '../../model/components/CRotation';
import CScale from '../../model/components/CScale';
import CScale3 from '../../model/components/CScale3';
import CTemporaryScale from '../../model/components/CTemporaryScale';
import CTube from '../../model/components/CTube';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class TransformUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(CObject3D)) {
            const cObject3D = node.get(CObject3D);
            const mesh = cObject3D.value;
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
                    if (node.has(CScale3)) {
                        mesh.scale.copy(node.value(CScale3));
                    }
                    if (node.has(CTemporaryScale)) {
                        mesh.scale.multiply(node.value(CTemporaryScale));
                    }
                    if (node.has(CIkNode)) {
                        const cIkNode = node.get(CIkNode);
                        mesh.position.copy(cIkNode.start);
                        mesh.quaternion.copy(cIkNode.quaternion);
                    }
                    if (node.has(CGeom3)) {
                        mesh.matrix.copy(node.get(CGeom3).matrix);
                    } else {
                        mesh.updateMatrix();
                    }
                    cObject3D.localTransformChanged = false;
                }
                if (cObject3D.worldTransformChanged) {
                    mesh.updateMatrixWorld(true);
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
