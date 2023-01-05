import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    label: 'Width',
    inputComponent: InputNumber,
    inputComponentProps: {min: 0},
})
export default class CWidth extends ModelNodeComponent<number> {
    value = 0.5;
}
