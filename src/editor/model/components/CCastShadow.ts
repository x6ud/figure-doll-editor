import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    instanceable: true,
    label: 'Cast Shadow',
    inputComponent: InputBoolean,
})
export default class CCastShadow extends ModelNodeComponent<boolean> {
    value = true;
}
