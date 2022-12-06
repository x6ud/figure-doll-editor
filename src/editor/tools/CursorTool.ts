import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import {Object3DUserData} from '../model/components/CObject3D';
import icon from './Cursor.png';
import EditorTool from './EditorTool';

export default class CursorTool extends EditorTool {
    label = 'Cursor';
    icon = icon;

    update(ctx: EditorContext, view: EditorView): void {
        if (!view.input.mouseOver) {
            return;
        }
        if (view.input.mouseLeftDownThisFrame) {
            const result = view.mousePick();
            if (!view.input.isKeyPressed('Control')) {
                ctx.model.selected = [];
            }
            for (let obj of result) {
                const node = (result[0].object.userData as Object3DUserData).node;
                if (node) {
                    ctx.model.addSelection(node.id);
                    break;
                }
            }
        }
    }
}
