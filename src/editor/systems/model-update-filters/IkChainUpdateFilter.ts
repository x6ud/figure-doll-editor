import {ConeGeometry, Group, Mesh, MeshBasicMaterial, Sprite, SpriteMaterial, TextureLoader} from 'three';
import EditorContext from '../../EditorContext';
import CIkNode from '../../model/components/CIkNode';
import CIkNodeLength from '../../model/components/CIkNodeLength';
import CIkNodeRotation from '../../model/components/CIkNodeRotation';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';
import ikMoveHandler from './ik-move-handler.png';
import ikRotateHandler from './ik-rotate-handler.png';

const texLoader = new TextureLoader();
let texIkMoveHandler = texLoader.load(ikMoveHandler);
let texIkRotateHandler = texLoader.load(ikRotateHandler);

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
        const group = cObject3D.value;
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
            if (!cIkNode.mesh) {
                const mesh = cIkNode.mesh = new Mesh();
                mesh.material = new MeshBasicMaterial({
                    depthWrite: false,
                    depthTest: false,
                    fog: false,
                    toneMapped: false,
                    transparent: true,
                    opacity: 0.5,
                    color: 0x777777
                });
                mesh.renderOrder = 1;
                mesh.visible = ctx.options.showIkBones;
                cObject3D.value.add(mesh);
            }
            const mesh = cIkNode.mesh as Mesh;
            mesh.geometry?.dispose();
            const length = curr.value(CIkNodeLength);
            mesh.geometry = new ConeGeometry(0.025, length, 6)
                .translate(0, curr.value(CIkNodeLength) / 2, 0)
                .rotateZ(-Math.PI / 2);
            const handlerScale = 24 / Math.min(ctx.views[ctx.mainViewIndex].width, ctx.views[ctx.mainViewIndex].height);
            if (!cIkNode.moveHandler) {
                cIkNode.moveHandler = new Sprite(new SpriteMaterial({
                    map: texIkMoveHandler,
                    sizeAttenuation: false,
                    depthTest: false,
                    depthWrite: false,
                    transparent: true,
                }));
                cIkNode.moveHandler.renderOrder = 2;
                cIkNode.moveHandler.scale.set(handlerScale, handlerScale, 1);
                cObject3D.value.add(cIkNode.moveHandler);
                cIkNode.moveHandler.visible = false;
            }
            if (!cIkNode.rotateHandler) {
                cIkNode.rotateHandler = new Sprite(new SpriteMaterial({
                    map: texIkRotateHandler,
                    sizeAttenuation: false,
                    depthTest: false,
                    depthWrite: false,
                    transparent: true,
                }));
                cIkNode.rotateHandler.renderOrder = 2;
                cIkNode.rotateHandler.scale.set(handlerScale, handlerScale, 1);
                cObject3D.value.add(cIkNode.rotateHandler);
                cIkNode.rotateHandler.visible = false;
            }
            cIkNode.dirty = false;
            if (i > 0) {
                cIkNode.start.copy(ikChain.children[i - 1].get(CIkNode).end);
            } else {
                cIkNode.start.set(0, 0, 0);
            }
            cIkNode.quaternion.setFromEuler(curr.value(CIkNodeRotation));
            cIkNode.end
                .set(curr.value(CIkNodeLength), 0, 0)
                .applyQuaternion(cIkNode.quaternion)
                .add(cIkNode.start);
            cIkNode.rotateHandler.position.set(length, 0, 0);
        }
    }
}
