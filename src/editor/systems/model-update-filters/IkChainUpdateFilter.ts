import {Group} from 'three';
import EditorContext from '../../EditorContext';
import CIkNode from '../../model/components/CIkNode';
import CIkNodeLength from '../../model/components/CIkNodeLength';
import CIkNodeRotation from '../../model/components/CIkNodeRotation';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class IkChainUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, ikChain: ModelNode): void {
        if (ikChain.type !== 'IKChain') {
            return;
        }
        const cObject3D = ikChain.get(CObject3D);
        if (!cObject3D.value) {
            cObject3D.value = new Group();
            (cObject3D.value.userData as Object3DUserData) = {node: ikChain};
        }
        for (let i = 0, len = ikChain.children.length; i < len; ++i) {
            const curr = ikChain.children[i];
            const cObject3D = curr.get(CObject3D);
            if (!cObject3D.value) {
                cObject3D.value = new Group();
                (cObject3D.value.userData as Object3DUserData) = {node: curr};
            }
            const cIkNode = curr.get(CIkNode);
            if (!cIkNode.dirty) {
                continue;
            }
            cIkNode.dirty = false;
            if (i > 0) {
                cIkNode.start.copy(ikChain.children[i - 1].get(CIkNode).end);
            } else {
                cIkNode.start.set(0, 0, 0);
            }
            cIkNode.quaternion.setFromEuler(curr.value(CIkNodeRotation));
            cIkNode.end.set(curr.value(CIkNodeLength), 0, 0)
                .applyQuaternion(cIkNode.quaternion)
                .add(cIkNode.start);
        }
    }
}
