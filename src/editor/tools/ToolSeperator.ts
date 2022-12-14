import EditorTool from './EditorTool';

export default class ToolSeperator extends EditorTool {
    static readonly instance = new ToolSeperator();
    icon: string = '';
    label: string = '';
    sep = true;
}
