import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    label: 'Operator',
    inputComponent: InputSelect,
    inputComponentProps: {options: ['add', 'subtract']}
})
export default class CSdfOperator extends ModelNodeComponent<'add' | 'subtract'> {
    value: 'add' | 'subtract' = 'add';
}
