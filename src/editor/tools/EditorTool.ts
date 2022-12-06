import EditorContext from '../EditorContext';
import EditorView from '../EditorView';

export default abstract class EditorTool {
    abstract label: string;
    abstract icon: string;
    /** Text set to status bar when tool is selected */
    tips: string = '';
    enableTransformControls: boolean = false;

    /** Called once on load */
    setup(ctx: EditorContext): void {
    }

    dispose(): void {
    }

    /** Called once every frame */
    begin(ctx: EditorContext): void {
    }

    /** Called for every active view */
    update(ctx: EditorContext, view: EditorView): void {
    }

    /** Called when tool is unselected */
    onUnselected(ctx: EditorContext): void {
    }
}
