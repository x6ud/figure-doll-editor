import Class from '../../../common/type/Class';
import CMesh from '../components/CMesh';
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
            if (node.has(CMesh)) {
                node.dirty = true;
                node.get(CMesh).dirty = true;
            }
        }
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        node.forEach(node => {
            if (node.has(CMesh)) {
                node.dirty = true;
                node.get(CMesh).dirty = true;
            }
        });
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

}
