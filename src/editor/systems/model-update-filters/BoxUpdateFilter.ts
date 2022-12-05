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
        ctx.nextFrameEnd(function () {
            if (node.deleted) {
                return;
            }
            const cObject3D = node.get(CObject3D);
            cObject3D.dispose();
            const size = cBoxSize.value;
            cObject3D.value = new Mesh(
                new BoxGeometry(size.x, size.y, size.z),
                new MeshStandardMaterial(),
            );
            (cObject3D.value.userData as Object3DUserData) = {node};
            ctx.model.dirty = true;
            node.dirty = true;
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
        });
    }
}
