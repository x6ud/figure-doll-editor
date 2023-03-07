import {Geom3} from '@jscad/modeling/src/geometries/geom3';
import {Matrix4, Object3D} from 'three';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({})
export default class CGeom3 extends ModelNodeComponent<Geom3 | null> {
    value: Geom3 | null = null;
    /** Whether geom3 need to be rebuilt */
    dirty: boolean = true;
    matrix: Matrix4 = new Matrix4();
    /** Whether matrix need to be updated */
    matDirty: boolean = true;
    /** Display when transforming object */
    placeholder?: Object3D;
    /** Whether to use temp matrix for the placeholder mesh. Used when resizing geom3. */
    useTempMat: boolean = false;
    tempMat: Matrix4 = new Matrix4();

    onRemoved() {
        if (this.placeholder) {
            this.placeholder.removeFromParent();
        }
    }
}
