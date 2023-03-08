import Class from '../../../common/type/Class';
import CGeom3 from '../components/CGeom3';
import CObject3D from '../components/CObject3D';
import CPosition from '../components/CPosition';
import CRotation from '../components/CRotation';
import CScale from '../components/CScale';
import CScale3 from '../components/CScale3';
import CTemporaryScale from '../components/CTemporaryScale';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

const transformComponents = [CPosition, CRotation, CScale, CScale3, CTemporaryScale];

export default class TransformWatcher implements ModelNodeChangedWatcher {

    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (transformComponents.includes(componentClass)) {
            if (node.has(CObject3D)) {
                const cObject3D = node.get(CObject3D);
                cObject3D.localTransformChanged = true;
                cObject3D.worldTransformChanged = true;
            }
            if (node.has(CGeom3)) {
                const cGeom3 = node.get(CGeom3);
                cGeom3.matDirty = true;
            }
        }
        if (node.type === 'Target') {
            node.parent && (node.parent.dirty = true);
        }
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        if (node.has(CObject3D)) {
            node.dirty = true;
            const cObject3D = node.get(CObject3D);
            cObject3D.parentChanged = true;
            cObject3D.worldTransformChanged = true;
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

}
