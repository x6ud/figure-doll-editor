import InputFileAsText from '../../components/input/InputFileAsText/InputFileAsText.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: '.obj File',
    inputComponent: InputFileAsText,
    inputComponentProps: {accept: '.obj'}
})
export default class CImportObj extends ModelNodeComponent<string> {
    value = '';
    dirty = true;
}
