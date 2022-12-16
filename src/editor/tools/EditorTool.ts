import {Sphere} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import DynamicMesh from '../utils/geometry/dynamic/DynamicMesh';

const _sphere = new Sphere();

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

    getSculptPicking(ctx: EditorContext, mesh: DynamicMesh): { indices: number[], indicesSym?: number[] } {
        _sphere.set(ctx.sculptLocal, ctx.sculptRadius);
        const indices = mesh.intersectSphere(_sphere);
        if (!ctx.sculptSym) {
            return {indices};
        }
        _sphere.set(ctx.sculptLocalSym, ctx.sculptRadius);
        const indicesSym = mesh.intersectSphere(_sphere);
        return {indices, indicesSym: indicesSym};
    }

    sculptFalloff(dist: number) {
        return 3 * dist ** 4 - 4 * dist ** 3 + 1;
    }
}
