import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    instanceable: true,
    label: 'Disable Flip',
    inlineLabel: true,
    inputComponent: InputBoolean,
})
export default class CDisableFlip extends ModelNodeComponent<boolean> {
    value = false;
}
