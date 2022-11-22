import {Group} from 'three';
import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class ContainerUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.type === 'container') {
            const cObject3D = node.get(CObject3D);
            if (!cObject3D.value) {
                cObject3D.value = new Group();
            }
        }
    }
}
