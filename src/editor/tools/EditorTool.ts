import EditorContext from '../EditorContext';
import EditorView from '../EditorView';

export default abstract class EditorTool {
    abstract label: string;
    abstract icon: string;
    /** Text set to status bar when tool is selected */
    tips: string = '';
    enableTransformControls: boolean = false;
    enableDefaultDeleteShortcut: boolean = true;
    enableSelectionRect: boolean = false;
    enableDefaultSelectionBehavior: boolean = false;

    /** Called once on load */
    setup(ctx: EditorContext): void {
    }

    dispose(): void {
    }

    begin(ctx: EditorContext): void {
    }

    update(ctx: EditorContext, view: EditorView): void {
    }

    end(ctx: EditorContext): void {
    }

    beforeRender(ctx: EditorContext, view: EditorView): void {
    }

    /** Called when tool is unselected */
    onUnselected(ctx: EditorContext): void {
    }
}
