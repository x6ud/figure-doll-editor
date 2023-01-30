import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    autoCopy: true,
    label: 'Hinge',
    inputComponent: InputSelect,
    inputComponentProps: {options: ['none', 'horizontal', 'vertical']},
})
export default class CHingeAxis extends ModelNodeComponent<'none' | 'horizontal' | 'vertical'> {
    value: 'none' | 'horizontal' | 'vertical' = 'none';
}
