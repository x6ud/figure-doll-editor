import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    autoCopy: true,
    label: 'Height',
    inputComponent: InputNumber,
    inputComponentProps: {min: 0, step: 0.001},
})
export default class CHeight extends ModelNodeComponent<number> {
    value = 0.5;
}
