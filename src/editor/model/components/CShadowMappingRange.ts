import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    autoCopy: true,
    label: 'Shadow Mapping Range',
    inputComponent: InputNumber,
    inputComponentProps: {min: 0}
})
export default class CShadowMappingRange extends ModelNodeComponent<number> {
    value = 10;
}
