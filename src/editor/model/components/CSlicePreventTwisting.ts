import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    label: 'Prevent Twisting',
    inlineLabel: true,
    inputComponent: InputBoolean,
})
export default class CSlicePreventTwisting extends ModelNodeComponent<boolean> {
    value: boolean = false;
}
