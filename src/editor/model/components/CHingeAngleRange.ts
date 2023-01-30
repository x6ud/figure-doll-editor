import InputDoubleRange from '../../components/input/InputDoubleRange/InputDoubleRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    autoCopy: true,
    label: 'Hinge Limit',
    inputComponent: InputDoubleRange,
    inputComponentProps: {min: -360, max: 360, maxDet: 360},
})
export default class CHingeAngleRange extends ModelNodeComponent<[number, number]> {
    value: [number, number] = [-180, +180];
}
