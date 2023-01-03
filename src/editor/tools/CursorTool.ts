import icon from './Cursor.png';
import EditorTool from './EditorTool';

export default class CursorTool extends EditorTool {
    name = CursorTool.name;
    label = 'Select';
    icon = icon;
    enableSelectionRect = true;
    enableDefaultSelectionBehavior = true;
}
