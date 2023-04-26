import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNode from '../ModelNode';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    autoCopy: true,
    label: 'Pose Root',
    inlineLabel: true,
    inputComponent: InputBoolean,
})
export default class COpenPoseRoot extends ModelNodeComponent<boolean> {
    value: boolean = false;
    dirty: boolean = true;
    keypoints: { [type: string]: ModelNode } = {};
}
