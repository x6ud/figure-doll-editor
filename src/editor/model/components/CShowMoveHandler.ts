import InputBoolean from '../../components/input/InputBoolean/InputBoolean.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    autoCopy: true,
    label: 'Move Handler',
    inlineLabel: true,
    inputComponent: InputBoolean,
})
export default class CShowMoveHandler extends ModelNodeComponent<boolean> {
    value = false;
}
