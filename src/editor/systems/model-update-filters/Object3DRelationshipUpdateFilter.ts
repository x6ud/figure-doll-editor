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
                const edge = cObject3D.edge;
                if (obj) {
                    obj.removeFromParent();
                    edge?.removeFromParent();
                    if (node.parent) {
                        if (node.parent.has(CObject3D)) {
                            const parent = node.parent.value(CObject3D);
                            if (parent) {
                                parent.add(obj);
                                edge && parent.add(edge);
                            }
                        }
                    } else {
                        ctx.scene.add(obj);
                        edge && ctx.scene.add(edge);
                    }
                }
                cObject3D.parentChanged = false;
            }
            const visible = node.has(CVisible) ? node.value(CVisible) : true;
            if (cObject3D.value) {
                cObject3D.value.visible = visible;
                if (cObject3D.edge) {
                    cObject3D.edge.visible = ctx.showEdges && visible;
                }
            }
        }
    }
}
