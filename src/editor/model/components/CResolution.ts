import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Resolution',
    inputComponent: InputNumber,
    inputComponentProps: {min: 1e-6},
})
export default class CResolution extends ModelNodeComponent<number> {
    value = 0.03;
    dirty = true;
}
