import InputDoubleRange from '../../components/input/InputDoubleRange/InputDoubleRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    autoCopy: true,
    label: 'Angle',
    inputComponent: InputDoubleRange,
    inputComponentProps: {min: 0, max: 360, maxDet: 360},
})
export default class CAngleRange extends ModelNodeComponent<[number, number]> {
    value: [number, number] = [0, 360];
}
