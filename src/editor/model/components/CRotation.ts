import {Euler} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
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
