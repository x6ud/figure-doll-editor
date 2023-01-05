import InputRange from '../../components/input/InputRange/InputRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    label: 'Angle',
    inputComponent: InputRange,
    inputComponentProps: {min: 0, max: 90, step: 0.1}
})
export default class CSpotLightAngle extends ModelNodeComponent<number> {
    value = 30;
}
