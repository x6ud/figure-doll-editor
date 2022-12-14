import {Vector3} from 'three';
import EditorContext from '../../EditorContext';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import CVertices from '../../model/components/CVertices';
import ModelNode from '../../model/ModelNode';
import DynamicMesh from '../../utils/geometry/dynamic/DynamicMesh';
import SdfMeshBuilder from '../../utils/geometry/SdfMeshBuilder';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class ClayUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.type !== 'Clay') {
            return;
        }
        const cVertices = node.get(CVertices);
        if (!cVertices.dirty) {
            return;
        }
        cVertices.dirty = false;
        if (cVertices.value.length === 0) {
            // make default sphere
            const sdfMeshBuilder = new SdfMeshBuilder();
            sdfMeshBuilder.sphere(new Vector3(0, 0, 0), 0.25, true);
            const {position} = sdfMeshBuilder.build();
            cVertices.value = new Float32Array(position);
        }
        const cObject3D = node.get(CObject3D);
        if (!cObject3D.mesh) {
            cObject3D.mesh = new DynamicMesh();
            cObject3D.mesh.buildFromTriangles(cVertices.value);
        } else {
            // todo
        }
        if (cObject3D.value) {
            cObject3D.mesh.toThree(cObject3D.value);
        } else {
            cObject3D.value = cObject3D.mesh.toThree();
            (cObject3D.value.userData as Object3DUserData) = {node};
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
        }
    }
}
