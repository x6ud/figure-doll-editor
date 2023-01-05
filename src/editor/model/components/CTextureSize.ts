import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Texture Quality',
    inputComponent: InputSelect,
    inputComponentProps: {options: ['128', '256', '512', '1024', '2048']}
})
export default class CTextureSize extends ModelNodeComponent<string> {
    value = '512';
}
