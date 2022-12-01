import {Vector3} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    equal(a: Vector3, b: Vector3) {
        return Math.abs(a.x - b.x) < 1e-8
            && Math.abs(a.y - b.y) < 1e-8
            && Math.abs(a.z - b.z) < 1e-8;
    },
    label: 'Position',
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
