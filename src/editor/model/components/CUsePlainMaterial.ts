import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    label: 'Use Plain Material',
    inlineLabel: true,
    inputComponent: InputBoolean,
})
export default class CUsePlainMaterial extends ModelNodeComponent<boolean> {
    value = false;
}
