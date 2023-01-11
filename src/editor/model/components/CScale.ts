import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    instanceable: true,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Scale',
    inputComponent: InputNumber,
    inputComponentProps: {resettable: true, defaultValue: 1, step: 0.001},
})
export default class CScale extends ModelNodeComponent<number> {
    value = 1.0;
}
