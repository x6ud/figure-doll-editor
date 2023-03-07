import {Vector2} from 'three';
import InputVector2 from '../../components/input/InputVector2/InputVector2.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    equal(a: Vector2, b: Vector2) {
        return a.equals(b);
    },
    label: 'Start Size',
    inputComponent: InputVector2,
    clone(val: Vector2) {
        return new Vector2().copy(val);
    },
    serialize(val: Vector2) {
        return [val.x, val.y];
    },
    deserialize(val: [number, number]) {
        return new Vector2(val[0], val[1]);
    },
})
export default class CSliceSize2Start extends ModelNodeComponent<Vector2> {
    value = new Vector2(.1, .1);
}
