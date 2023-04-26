import {Object3D} from 'three';
import EditorContext from '../../EditorContext';
import CObject3D from '../../model/components/CObject3D';
import COpenPoseKeypoint from '../../model/components/COpenPoseKeypoint';
import COpenPoseRoot from '../../model/components/COpenPoseRoot';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class OpenPoseUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(COpenPoseRoot)) {
            const cOpenPoseRoot = node.get(COpenPoseRoot);
            if (cOpenPoseRoot.dirty) {
                cOpenPoseRoot.dirty = false;
                cOpenPoseRoot.keypoints = {};
                if (cOpenPoseRoot.value) {
                    node.forEach(child => {
                        if (child.type === 'OpenPoseKeypoint') {
                            const type = child.value(COpenPoseKeypoint);
                            if (type) {
                                cOpenPoseRoot.keypoints[type] = child;
                            }
                        }
                    });
                }
            }
        } else if (node.has(COpenPoseKeypoint)) {
            const cObject3D = node.get(CObject3D);
            if (!cObject3D.value) {
                cObject3D.value = new Object3D();
                cObject3D.parentChanged = true;
                cObject3D.worldTransformChanged = true;
            }
        }
    }
}
