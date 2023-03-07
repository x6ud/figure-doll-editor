import {Vector2} from 'three';
import InputVector2 from '../../components/input/InputVector2/InputVector2.vue';
import {vectorsEqual} from '../../utils/math';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    instanceable: true,
    equal: vectorsEqual,
    label: 'Start Radius',
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
export default class CStartRadius2 extends ModelNodeComponent<Vector2> {
    value = new Vector2(.5, .5);
}
