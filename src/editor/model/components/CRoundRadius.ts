import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Round Radius',
    inputComponent: InputNumber,
    inputComponentProps: {min: 0, step: 0.001},
})
export default class CRoundRadius extends ModelNodeComponent<number> {
    value = 0.05;
}
