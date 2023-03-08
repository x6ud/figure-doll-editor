import {Texture} from 'three';
import InputFileAsDataURL from '../../components/input/InputFileAsDataURL/InputFileAsDataURL.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Image File',
    inputComponent: InputFileAsDataURL,
    inputComponentProps: {accept: 'image/png, image/jpeg, image/webp'}
})
export default class CImage extends ModelNodeComponent<string> {
    value = '';
    dirty = true;
    texture?: Texture;

    onRemoved() {
        if (this.texture) {
            this.texture.dispose();
        }
    }
}
