import {BoxGeometry, Mesh, MeshStandardMaterial} from 'three';
import EditorContext from '../../EditorContext';
import CBoxSize from '../../model/components/CBoxSize';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class BoxUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.type !== 'Box') {
            return;
        }
        const cBoxSize = node.get(CBoxSize);
        if (!cBoxSize.dirty) {
            return;
        }
        cBoxSize.dirty = false;

        const cObject3D = node.get(CObject3D);
        const size = cBoxSize.value;
        const geometry = new BoxGeometry(size.x, size.y, size.z);
        if (cObject3D.value) {
            const mesh = cObject3D.value as Mesh;
            mesh.geometry.dispose();
            mesh.geometry = geometry;
        } else {
            cObject3D.value = new Mesh(
                geometry,
                new MeshStandardMaterial(),
            );
            (cObject3D.value.userData as Object3DUserData) = {node};
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
        }
        // if (!cObject3D.edge) {
        //     cObject3D.edge = new LineSegments(
        //         new EdgesGeometry(geometry),
        //         new LineBasicMaterial({
        //             color: 0x000000,
        //         })
        //     );
        // } else {
        //     const edge = cObject3D.edge as LineSegments;
        //     edge.geometry.dispose();
        //     edge.geometry = new EdgesGeometry(geometry);
        // }
    }
}
