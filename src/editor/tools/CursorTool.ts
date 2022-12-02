import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import {Object3DUserData} from '../model/components/CObject3D';
import icon from './Cursor.png';
import EditorTool from './EditorTool';

export default class CursorTool implements EditorTool {
    label = 'Cursor';
    icon = icon;

    update(ctx: EditorContext, view: EditorView): void {
        if (!view.input.mouseOver) {
            return;
        }
        if (view.input.mouseLeftDownThisFrame) {
            const result = view.raycaster.intersectObjects(ctx.readonlyRef().scene.children.filter(
                obj => !!(obj.userData as Object3DUserData).node
            ));
            if (result.length) {
                const node = (result[0].object.userData as Object3DUserData).node!;
                if (view.input.isKeyPressed('Control')) {
                    ctx.model.addSelection(node.id);
                } else {
                    ctx.model.selected = [node.id];
                }
            } else {
                if (!view.input.isKeyPressed('Control')) {
                    ctx.model.selected = [];
                }
            }
        }
    }
}
