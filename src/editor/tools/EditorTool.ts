import EditorContext from '../EditorContext';
import EditorView from '../EditorView';

export default interface EditorTool {
    label: string;
    icon: string;

    update(ctx: EditorContext, view: EditorView): void;
}
