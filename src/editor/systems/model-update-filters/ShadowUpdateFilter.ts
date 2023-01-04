import {Group} from 'three';
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
        if ((object as Group).isGroup) {
            for (let child of object.children) {
                if (node.has(CCastShadow)) {
                    child.castShadow = node.value(CCastShadow);
                }
                if (node.has(CReceiveShadow)) {
                    child.receiveShadow = node.value(CReceiveShadow);
                }
            }
        } else {
            if (node.has(CCastShadow)) {
                object.castShadow = node.value(CCastShadow);
            }
            if (node.has(CReceiveShadow)) {
                object.receiveShadow = node.value(CReceiveShadow);
            }
        }
    }
}
