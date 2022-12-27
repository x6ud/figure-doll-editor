import {Object3D, Quaternion, Sprite, Vector3} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';
import {disposeObject3D} from './CObject3D';

@registerModelComponent({})
export default class CIkNode extends ModelNodeComponent<void> {
    value = undefined;
    dirty = true;
    start = new Vector3();
    end = new Vector3();
    quaternion = new Quaternion();
    mesh?: Object3D;
    moveHandler?: Sprite;
    rotateHandler?: Sprite;

    onRemoved() {
        if (this.mesh) {
            disposeObject3D(this.mesh);
        }
        if (this.moveHandler) {
            this.moveHandler.geometry.dispose();
            this.moveHandler.material.dispose();
        }
        if (this.rotateHandler) {
            this.rotateHandler.geometry.dispose();
            this.rotateHandler.material.dispose();
        }
    }
}
