import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Angle Start',
    inlineLabel: true,
    inputComponent: InputNumber
})
export default class CSliceAngleStart extends ModelNodeComponent<number> {
    value = 0;
}
