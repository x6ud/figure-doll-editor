import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    instanceable: true,
    label: 'Sign',
    inlineLabel: true,
    inputComponent: InputSelect,
    inputComponentProps: {options: ['positive', 'negative']}
})
export default class CSign extends ModelNodeComponent<'positive' | 'negative'> {
    value: 'positive' | 'negative' = 'positive';
}
