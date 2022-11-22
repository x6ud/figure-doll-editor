import {Mesh} from 'three';
import EditorContext from '../../EditorContext';
import ModelNodeComponent from '../ModelNodeComponent';

export default class CMesh extends ModelNodeComponent<Mesh | null> {
    value: Mesh | null = null;
    dirty: boolean = true;

    onRemoved(ctx: EditorContext) {
        if (this.value) {
            ctx.scene.remove(this.value);
        }
    }
}
