import {Texture} from 'three';
import InputImage from '../../components/input/InputImage/InputImage.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Image',
    inputComponent: InputImage
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
