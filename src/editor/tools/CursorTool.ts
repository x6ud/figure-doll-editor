import icon from './Cursor.png';
import EditorTool from './EditorTool';

export default class CursorTool extends EditorTool {
    label = 'Cursor';
    icon = icon;
    enableSelectionRect = true;
    enableDefaultSelectionBehavior = true;
}
