import inputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    instanceable: true,
    label: 'Render Edge',
    inlineLabel: true,
    inputComponent: inputBoolean,
})
export default class CRenderEdge extends ModelNodeComponent<boolean> {
    value: boolean = true;
}
