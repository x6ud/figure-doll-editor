import InputRange from '../../components/input/InputRange/InputRange.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    autoCopy: true,
    label: 'Edge Softness',
    inputComponent: InputRange,
    inputComponentProps: {min: 0, max: 1, step: 0.01}
})
export default class CPenumbra extends ModelNodeComponent<number> {
    value = 0;
}
