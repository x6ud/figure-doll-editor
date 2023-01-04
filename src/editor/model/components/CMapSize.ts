import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Shadow Quality',
    inputComponent: InputSelect,
    inputComponentProps: {options: ['128', '256', '512', '1024', '2048']}
})
export default class CMapSize extends ModelNodeComponent<string> {
    value = '512';
}
