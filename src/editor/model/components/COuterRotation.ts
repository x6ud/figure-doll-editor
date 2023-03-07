import InputRange from '../../components/input/InputRange/InputRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    autoCopy: true,
    label: 'Angle',
    inputComponent: InputRange,
    inputComponentProps: {min: 0, max: 360, step: 0.1}
})
export default class COuterRotation extends ModelNodeComponent<number> {
    value = 360;
}
