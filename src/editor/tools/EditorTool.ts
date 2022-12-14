import EditorContext from '../EditorContext';
import EditorView from '../EditorView';

export default abstract class EditorTool {
    abstract label: string;
    abstract icon: string;
    sep: boolean = false;
    /** Text set to status bar when tool is selected */
    tips: string = '';
    enableTransformControls: boolean = false;
    enableDefaultDeleteShortcut: boolean = true;
    enableSelectionRect: boolean = false;
    enableDefaultSelectionBehavior: boolean = false;
    sculpt: boolean = false;
    brushRadius: number = 50;
    brushStrength: number = 0.5;
    brushOperator: boolean = true;

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
