import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import EditorContext from '../../EditorContext';
import CObj from '../../model/components/CObj';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class ObjUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (!node.has(CObj)) {
            return;
        }
        const cObj = node.get(CObj);
        if (!cObj.dirty) {
            return;
        }
        cObj.dirty = false;
        if (!cObj.value) {
            return;
        }
        const cObject3D = node.get(CObject3D);
        cObject3D.dispose();
        const group = cObject3D.value = new OBJLoader().parse(cObj.value);
        (cObject3D.value.userData as Object3DUserData) = {node};
        for (let child of cObject3D.value.children) {
            (child.userData as Object3DUserData) = {node};
        }
        cObject3D.parentChanged = true;
        cObject3D.localTransformChanged = true;
        // if (cObject3D.edge) {
        //     disposeObject3D(cObject3D.edge);
        // }
        // const edge = cObject3D.edge = new Group();
        // for (let child of group.children) {
        //     const mesh = child as Mesh;
        //     if (mesh.geometry) {
        //         edge.add(new LineSegments(
        //             new EdgesGeometry(mesh.geometry),
        //             new LineBasicMaterial({
        //                 color: 0x000000,
        //             })
        //         ));
        //     }
        // }
    }
}
