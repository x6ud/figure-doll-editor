import {CameraHelper, Object3D} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';
import {disposeObject3D} from './CObject3D';

@registerModelComponent({})
export default class CLightHelper extends ModelNodeComponent<Object3D | null> {
    value: Object3D | null = null;

    onRemoved() {
        if (this.value) {
            disposeObject3D(this.value);
            this.value.removeFromParent();
        }
    }
}
