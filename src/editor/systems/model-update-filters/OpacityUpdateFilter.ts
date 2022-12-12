import {Mesh} from 'three';
import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import COpacity from '../../model/components/COpacity';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class OpacityUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        node.opacity = (node.parent ? node.parent.opacity : 1)
            * (node.has(COpacity) ? node.value(COpacity) : 1);
        if (node.has(CObject3D)) {
            const cObject3D = node.get(CObject3D);
            if (cObject3D.value) {
                const obj = cObject3D.value as Mesh;
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        for (let material of obj.material) {
                            if (material.opacity !== node.opacity) {
                                material.opacity = node.opacity;
                                material.transparent = material.opacity < 1;
                                material.needsUpdate = true;
                            }
                        }
                    } else {
                        if (obj.material.opacity !== node.opacity) {
                            obj.material.opacity = node.opacity;
                            obj.material.transparent = obj.material.opacity < 1;
                            obj.material.needsUpdate = true;
                        }
                    }
                }
            }
        }
    }
}
