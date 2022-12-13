import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Symmetry',
    inputComponent: InputSelect,
    inputComponentProps: {options: ['none', 'x', 'y', 'z']}
})
export default class CSdfSymmetry extends ModelNodeComponent<'none' | 'x' | 'y' | 'z'> {
    value: 'none' | 'x' | 'y' | 'z' = 'none';
    dirty: boolean = true;
}
