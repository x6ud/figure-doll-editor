import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import CVisible from '../../model/components/CVisible';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class Object3DRelationshipUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(CObject3D)) {
            const cObject3D = node.get(CObject3D);
            if (cObject3D.parentChanged) {
                const obj = cObject3D.value;
                if (obj) {
                    obj.removeFromParent();
                    if (node.parent) {
                        if (node.parent.has(CObject3D)) {
                            const parent = node.parent.value(CObject3D);
                            if (parent) {
                                parent.add(obj);
                            }
                        }
                    } else {
                        ctx.scene.add(obj);
                    }
                }
                cObject3D.parentChanged = false;
            }
            if (node.has(CVisible)) {
                if (cObject3D.value) {
                    cObject3D.value.visible = node.value(CVisible);
                }
            }
        }
    }
}
