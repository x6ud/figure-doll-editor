import EditorTool from './EditorTool';
import icon from './SculptBrush.png';

export default class SculptBrushTool extends EditorTool {
    label = 'Sculpt Brush';
    icon = icon;
    sculpt = true;
}
