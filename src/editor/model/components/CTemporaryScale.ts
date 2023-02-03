import {Vector3} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    autoCopy: true,
    clone(val: Vector3) {
        return new Vector3().copy(val);
    },
})
export default class CTemporaryScale extends ModelNodeComponent<Vector3> {
    value = new Vector3(1, 1, 1);
}
