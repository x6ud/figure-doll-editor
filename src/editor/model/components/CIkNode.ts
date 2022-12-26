import {Quaternion, Vector3} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({})
export default class CIkNode extends ModelNodeComponent<void> {
    value = undefined;
    dirty = true;
    start = new Vector3();
    end = new Vector3();
    quaternion = new Quaternion();
}
