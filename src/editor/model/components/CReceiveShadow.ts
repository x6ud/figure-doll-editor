import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    instanceable: true,
    label: 'Receive Shadow',
    inputComponent: InputBoolean,
})
export default class CReceiveShadow extends ModelNodeComponent<boolean> {
    value = true;
}
