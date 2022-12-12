import InputFileAsDataURL from '../../components/input/InputFileAsDataURL/InputFileAsDataURL.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: '.fbx File',
    inputComponent: InputFileAsDataURL,
    inputComponentProps: {accept: '.fbx'},
})
export default class CImportFbx extends ModelNodeComponent<string> {
    value: string = '';
    dirty = true;
}
