import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    autoCopy: true,
    label: 'Rotate Handler',
    inlineLabel: true,
    inputComponent: InputBoolean,
})
export default class CShowRotateHandler extends ModelNodeComponent<boolean> {
    value = true;
}
