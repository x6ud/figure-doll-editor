import {Vector3} from 'three';
import {vectorsEqual} from '../../utils/math';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    instanceable: true,
    equal: vectorsEqual,
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
export default class CFlipDirection extends ModelNodeComponent<Vector3> {
    value = new Vector3();
}
