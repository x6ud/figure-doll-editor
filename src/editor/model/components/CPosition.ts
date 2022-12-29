import {Vector3} from 'three';
import InputVector3 from '../../components/input/InputVector3/InputVector3.vue';
import {vectorsEqual} from '../../utils/math';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    equal: vectorsEqual,
    label: 'Position',
    inputComponent: InputVector3,
    inputComponentProps: {resettable: true},
    clone(val: Vector3) {
        return new Vector3().copy(val);
    },
    serialize(val: Vector3) {
        return [val.x, val.y, val.z];
    },
    deserialize(val: [number, number, number]) {
        return new Vector3(val[0], val[1], val[2]);
    },
})
export default class CPosition extends ModelNodeComponent<Vector3> {
    value = new Vector3();
}
