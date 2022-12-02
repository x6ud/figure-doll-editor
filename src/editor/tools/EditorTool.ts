import EditorContext from '../EditorContext';
import EditorView from '../EditorView';

export default abstract class EditorTool {
    abstract label: string;
    abstract icon: string;
    enableTransformControls: boolean = false;

    abstract begin(ctx: EditorContext): void;

    abstract update(ctx: EditorContext, view: EditorView): void;
}
