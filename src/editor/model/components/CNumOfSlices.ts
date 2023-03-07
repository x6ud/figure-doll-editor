import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    label: 'Curve Segments',
    inlineLabel: true,
    inputComponent: InputNumber
})
export default class CNumOfSlices extends ModelNodeComponent<number> {
    value = 30;
}
