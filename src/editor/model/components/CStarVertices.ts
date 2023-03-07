import InputNumber from '../../components/input/InputNumber/InputNumber.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER,
    label: 'Star Vertices',
    inputComponent: InputNumber,
})
export default class CStarVertices extends ModelNodeComponent<number> {
    value = 5;
}
