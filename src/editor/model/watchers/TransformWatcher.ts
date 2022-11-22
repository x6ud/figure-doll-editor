import Class from '../../../common/type/Class';
import CObject3D from '../components/CObject3D';
import CPosition from '../components/CPosition';
import CRotation from '../components/CRotation';
import CScale from '../components/CScale';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

const targets = [CPosition, CRotation, CScale];

export default class TransformWatcher implements ModelNodeChangedWatcher {

    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (targets.includes(componentClass)) {
            if (node.has(CObject3D)) {
                node.dirty = true;
                node.get(CObject3D).transformChanged = true;
            }
        }
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        node.forEach(node => {
            if (node.has(CObject3D)) {
                node.dirty = true;
                const cObject3D = node.get(CObject3D);
                cObject3D.parentChanged = true;
                cObject3D.transformChanged = true;
            }
        });
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

}
