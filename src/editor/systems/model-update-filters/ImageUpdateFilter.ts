import {Mesh, MeshLambertMaterial, Texture} from 'three';
import EditorContext from '../../EditorContext';
import CImage from '../../model/components/CImage';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import DoubleSidedPlaneGeometry from '../../utils/geometry/DoubleSidedPlaneGeometry';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class ImageUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.instanceId) {
            return;
        }
        if (!node.has(CImage)) {
            return;
        }
        const cImage = node.get(CImage);
        if (!cImage.dirty) {
            return;
        }
        cImage.dirty = false;
        if (!cImage.value) {
            return;
        }
        const image = new Image();
        image.onload = function () {
            if (node.deleted) {
                return;
            }
            if (image.src !== cImage.value) {
                return;
            }
            if (cImage.texture) {
                cImage.texture.dispose();
            }
            const texture = cImage.texture = new Texture();
            cImage.texture.image = image;
            cImage.texture.needsUpdate = true;
            if (node.type !== 'Image') {
                return;
            }
            const cObject3D = node.get(CObject3D);
            cObject3D.dispose();
            const width = 1;
            const height = image.height / image.width * width;
            cObject3D.value = new Mesh(
                new DoubleSidedPlaneGeometry(width, height),
                new MeshLambertMaterial({map: texture}),
            );
            (cObject3D.value.userData as Object3DUserData) = {node};
            ctx.model.dirty = true;
            node.dirty = true;
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
            ctx.model.instanceMeshChanged(node.id);
        };
        image.src = cImage.value;
    }
}
