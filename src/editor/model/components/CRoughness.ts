import InputRange from '../../components/input/InputRange/InputRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Roughness',
    inputComponent: InputRange,
    inputComponentProps: {min: 0, max: 1, step: 0.01},
})
export default class CRoughness extends ModelNodeComponent<number> {
    value = 1.0;
}
