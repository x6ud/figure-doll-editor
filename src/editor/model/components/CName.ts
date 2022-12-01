import InputString from '../../components/input/InputString/InputString.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Name',
    inputComponent: InputString,
})
export default class CName extends ModelNodeComponent<string> {
    value = '';
}
