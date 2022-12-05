import EditorContext from '../EditorContext';
import BoxEdge from '../utils/geometry/BoxEdge';
import icon from './Box.png';
import EditorTool from './EditorTool';

export default class BoxTool extends EditorTool {
    label = 'Box';
    icon = icon;
    tips = 'Hold [Alt] to create a box';

    private boxEdge = new BoxEdge();

    setup(ctx: EditorContext) {
        this.boxEdge.visible = false;
        ctx.scene.add(this.boxEdge);
    }

}
