import {
    BufferGeometry,
    CircleGeometry,
    ConeGeometry,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Points,
    PointsMaterial,
    TextureLoader,
    Vector3
} from 'three';
import EditorContext from '../../EditorContext';
import CHingeAngleRange from '../../model/components/CHingeAngleRange';
import CHingeAxis from '../../model/components/CHingeAxis';
import CIkNode from '../../model/components/CIkNode';
import CIkNodeLength from '../../model/components/CIkNodeLength';
import CIkNodeRotation from '../../model/components/CIkNodeRotation';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';
import ikMoveHandler from './ik-move-handler.png';
import ikRotateHandler from './ik-rotate-handler.png';

const texLoader = new TextureLoader();
const texIkMoveHandler = texLoader.load(ikMoveHandler);
texIkMoveHandler.minFilter = texIkMoveHandler.magFilter = NearestFilter;
const texIkRotateHandler = texLoader.load(ikRotateHandler);
texIkRotateHandler.minFilter = texIkRotateHandler.magFilter = NearestFilter;

export default class IkChainUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, ikChain: ModelNode): void {
        if (ikChain.type !== 'IKChain') {
            return;
        }
        if (ikChain.instanceId) {
            ikChain.instanceMeshDirty = false;
        }

        // create chain 3d object
        const cObject3D = ikChain.get(CObject3D);
        if (!cObject3D.value) {
            cObject3D.value = new Group();
            (cObject3D.value.userData as Object3DUserData) = {node: ikChain};
        }

        for (let i = 0, len = ikChain.children.length; i < len; ++i) {
            const curr = ikChain.children[i];
            if (curr.instanceId) {
                curr.instanceMeshDirty = false;
            }

            // create joint 3d object
            const cObject3D = curr.get(CObject3D);
            if (!cObject3D.value) {
                cObject3D.value = new Group();
                (cObject3D.value.userData as Object3DUserData) = {node: curr};
            }

            const cIkNode = curr.get(CIkNode);
            if (!cIkNode.dirty) {
                continue;
            }

            // bone
            if (!cIkNode.boneMesh) {
                const mesh = cIkNode.boneMesh = new Mesh();
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
            const mesh = cIkNode.boneMesh as Mesh;
            const length = curr.value(CIkNodeLength);
            const cone = mesh.geometry as ConeGeometry | undefined;
            if (cone?.parameters?.height !== length) {
                mesh.geometry?.dispose();
                mesh.geometry = new ConeGeometry(0.003, length, 6)
                    .translate(0, curr.value(CIkNodeLength) / 2, 0)
                    .rotateZ(-Math.PI / 2);
            }

            // hinge indicator
            const hingeRange = curr.value(CHingeAngleRange);
            const lower = hingeRange[0] / 180 * Math.PI;
            const upper = hingeRange[1] / 180 * Math.PI;
            if (!cIkNode.hingeIndicator) {
                const indicator = cIkNode.hingeIndicator = new Mesh();
                indicator.material = new MeshBasicMaterial({
                    depthWrite: false,
                    depthTest: false,
                    fog: false,
                    toneMapped: false,
                    transparent: true,
                    opacity: 0.5,
                    color: 0xffffff,
                    side: DoubleSide,
                });
                indicator.renderOrder = 1;
            }
            const hingeIndicator = cIkNode.hingeIndicator as Mesh;
            hingeIndicator.visible = ctx.options.showIkBones && curr.value(CHingeAxis) !== 'none';
            const hingeIndicatorParent = i === 0 ? ikChain.value(CObject3D)! : ikChain.children[i - 1].value(CObject3D)!;
            if (hingeIndicator.parent !== hingeIndicatorParent) {
                hingeIndicatorParent.add(hingeIndicator);
            }
            const hingeIndicatorGeometry = hingeIndicator.geometry as CircleGeometry;
            if (!hingeIndicatorGeometry
                || hingeIndicatorGeometry?.parameters?.thetaStart !== lower
                || hingeIndicatorGeometry?.parameters?.thetaLength !== upper - lower
            ) {
                hingeIndicatorGeometry?.dispose();
                hingeIndicator.geometry = new CircleGeometry(
                    0.025,
                    32,
                    lower,
                    upper - lower
                );
            }
            switch (curr.value(CHingeAxis)) {
                case 'horizontal':
                    hingeIndicator.rotation.set(-Math.PI / 2, 0, 0);
                    cIkNode.hingeEnabled = true;
                    (hingeIndicator.material as MeshBasicMaterial).color.setHex(0x00ffff);
                    break;
                case 'vertical':
                    hingeIndicator.rotation.set(0, 0, 0);
                    cIkNode.hingeEnabled = true;
                    (hingeIndicator.material as MeshBasicMaterial).color.setHex(0xffff00);
                    break;
                default:
                    cIkNode.hingeEnabled = false;
                    break;
            }
            if (i === 0) {
                hingeIndicator.position.set(0, 0, 0);
            } else {
                hingeIndicator.position.set(ikChain.children[i - 1].value(CIkNodeLength), 0, 0);
            }

            // handlers
            if (!cIkNode.moveHandler) {
                cIkNode.moveHandler = new Points(
                    new BufferGeometry().setFromPoints([new Vector3()]),
                    new PointsMaterial({
                        map: texIkMoveHandler,
                        sizeAttenuation: false,
                        depthTest: false,
                        depthWrite: false,
                        transparent: true,
                        size: 24,
                    }));
                cIkNode.moveHandler.renderOrder = 2;
                cObject3D.value.add(cIkNode.moveHandler);
                cIkNode.moveHandler.visible = false;
            }
            if (!cIkNode.rotateHandler) {
                cIkNode.rotateHandler = new Points(
                    new BufferGeometry().setFromPoints([new Vector3()]),
                    new PointsMaterial({
                        map: texIkRotateHandler,
                        sizeAttenuation: false,
                        depthTest: false,
                        depthWrite: false,
                        transparent: true,
                        size: 24,
                    }));
                cIkNode.rotateHandler.renderOrder = 2;
                cObject3D.value.add(cIkNode.rotateHandler);
                cIkNode.rotateHandler.visible = false;
            }

            // update position
            cIkNode.dirty = false;
            cIkNode.quaternion.setFromEuler(curr.value(CIkNodeRotation));
            if (i > 0) {
                const prev = ikChain.children[i - 1].get(CIkNode);
                cIkNode.start.copy(prev.end);
                cIkNode.quaternion.multiplyQuaternions(prev.quaternion, cIkNode.quaternion).normalize();
            } else {
                cIkNode.start.set(0, 0, 0);
            }
            cIkNode.end
                .set(curr.value(CIkNodeLength), 0, 0)
                .applyQuaternion(cIkNode.quaternion)
                .add(cIkNode.start);
            cIkNode.rotateHandler.position.set(length, 0, 0);
        }
    }
}
