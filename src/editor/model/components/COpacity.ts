import InputRange from '../../components/input/InputRange/InputRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    instanceable: true,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Opacity',
    inputComponent: InputRange,
    inputComponentProps: {min: 0, max: 1, step: 0.01}
})
export default class COpacity extends ModelNodeComponent<number> {
    value = 1.0;
}
