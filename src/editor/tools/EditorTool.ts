import EditorContext from '../EditorContext';
import EditorView from '../EditorView';

export default abstract class EditorTool {
    abstract label: string;
    abstract icon: string;
    enableTransformControls: boolean = false;

    setup(ctx: EditorContext): void {
    }

    dispose(): void {
    }

    begin(ctx: EditorContext): void {
    }

    update(ctx: EditorContext, view: EditorView): void {
    }
}
