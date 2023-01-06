import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import EditorContext from '../../EditorContext';
import CImportFbx from '../../model/components/CImportFbx';
import CImportObj from '../../model/components/CImportObj';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {dataUrlToArrayBuffer} from '../../utils/convert';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class ImportModelUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.instanceId) {
            return;
        }
        if (node.has(CImportObj)) {
            const cObj = node.get(CImportObj);
            if (!cObj.dirty) {
                return;
            }
            cObj.dirty = false;
            if (!cObj.value) {
                return;
            }
            const cObject3D = node.get(CObject3D);
            cObject3D.dispose();
            cObject3D.value = new OBJLoader().parse(cObj.value);
            (cObject3D.value.userData as Object3DUserData) = {node};
            for (let child of cObject3D.value.children) {
                (child.userData as Object3DUserData) = {node};
            }
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
            ctx.model.instanceMeshUpdated(node.id, true);
        } else if (node.has(CImportFbx)) {
            const cFbx = node.get(CImportFbx);
            if (!cFbx.dirty) {
                return;
            }
            cFbx.dirty = false;
            if (!cFbx.value) {
                return;
            }
            const cObject3D = node.get(CObject3D);
            cObject3D.dispose();
            dataUrlToArrayBuffer(cFbx.value).then(function (buffer) {
                if (node.deleted) {
                    return;
                }
                cObject3D.value = new FBXLoader().parse(buffer, undefined as any as string);
                (cObject3D.value.userData as Object3DUserData) = {node};
                for (let child of cObject3D.value.children) {
                    (child.userData as Object3DUserData) = {node};
                }
                cObject3D.parentChanged = true;
                cObject3D.localTransformChanged = true;
                node.dirty = true;
                ctx.model.dirty = true;
                ctx.model.instanceMeshUpdated(node.id, true);
            });
        }
    }
}
