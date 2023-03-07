import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

type SliceShape = 'ellipse' | 'rectangle' | 'star';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Shape',
    inlineLabel: true,
    inputComponent: InputSelect,
    inputComponentProps: {options: ['ellipse', 'rectangle', 'star']}
})
export default class CSliceShape extends ModelNodeComponent<SliceShape> {
    value: SliceShape = 'ellipse';
}
