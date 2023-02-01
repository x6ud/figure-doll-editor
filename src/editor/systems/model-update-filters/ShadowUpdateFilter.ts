import {Object3D} from 'three';
import EditorContext from '../../EditorContext';
import CCastShadow from '../../model/components/CCastShadow';
import CObject3D from '../../model/components/CObject3D';
import CReceiveShadow from '../../model/components/CReceiveShadow';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class ShadowUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (!node.has(CObject3D)) {
            return;
        }
        if (!node.has(CCastShadow) && !node.has(CReceiveShadow)) {
            return;
        }
        const object = node.value(CObject3D);
        if (!object) {
            return;
        }
        const castShadow = node.has(CCastShadow) ? node.value(CCastShadow) : null;
        const receiveShadow = node.has(CReceiveShadow) ? node.value(CReceiveShadow) : null;
        const stack: Object3D[] = [object];
        while (stack.length) {
            const obj = stack.pop();
            if (!obj) {
                break;
            }
            if (castShadow != null) {
                obj.castShadow = castShadow;
            }
            if (receiveShadow != null) {
                obj.receiveShadow = receiveShadow;
            }
            stack.push(...obj.children);
        }
    }
}
