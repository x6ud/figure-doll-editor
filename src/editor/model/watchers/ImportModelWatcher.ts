import Class from '../../type/Class';
import CImportFbx from '../components/CImportFbx';
import CImportObj from '../components/CImportObj';
import CImportReadonlyGltf from '../components/CImportReadonlyGltf';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

export default class ImportModelWatcher implements ModelNodeChangedWatcher {

    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (componentClass === CImportObj) {
            node.get(CImportObj).dirty = true;
        } else if (componentClass === CImportFbx) {
            node.get(CImportFbx).dirty = true;
        } else if (componentClass === CImportReadonlyGltf) {
            node.get(CImportReadonlyGltf).dirty = true;
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
    }

}
