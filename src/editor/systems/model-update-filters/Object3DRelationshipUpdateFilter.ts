import {toRaw} from 'vue';
import EditorContext from '../../EditorContext';
import CGeom3 from '../../model/components/CGeom3';
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
                    const parentNode = toRaw(node.parent);
                    if (parentNode) {
                        if (parentNode.has(CObject3D)) {
                            const parent = parentNode.value(CObject3D);
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
            let visible = node.has(CVisible) ? node.value(CVisible) : true;
            if (node.has(CGeom3) && node.parent?.has(CGeom3)) {
                visible = false;
            }
            if (cObject3D.value) {
                cObject3D.value.visible = visible;
            }
        }
    }
}
