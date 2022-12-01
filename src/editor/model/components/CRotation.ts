import {Euler} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    equal(a: Euler, b: Euler) {
        return Math.abs(a.x - b.x) < 1e-8
            && Math.abs(a.y - b.y) < 1e-8
            && Math.abs(a.z - b.z) < 1e-8;
    },
    label: 'Rotation',
    serialize(val: Euler) {
        return [val.x, val.y, val.z];
    },
    deserialize(val: [number, number, number]) {
        return new Euler(val[0], val[1], val[2]);
    },
})
export default class CRotation extends ModelNodeComponent<Euler> {
    value = new Euler();
}
