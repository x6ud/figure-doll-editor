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

    getSculptPicking(ctx: EditorContext, mesh: DynamicMesh): {
        triangles: number[],
        indices: number[],
        trianglesSym?: number[],
        indicesSym?: number[],
    } {
        _sphere.set(ctx.sculptLocal, ctx.sculptRadius);
        const triangles = mesh.intersectSphere(_sphere);
        const indices: number[] = [];
        const visited = new Set<number>();
        for (let tri of triangles) {
            for (let v = 0; v < 3; ++v) {
                const vertexIdx = mesh.sharedVertexMap[tri * 3 + v];
                if (!visited.has(vertexIdx)) {
                    visited.add(vertexIdx);
                    indices.push(vertexIdx);
                }
            }
        }
        if (!ctx.sculptSym) {
            return {triangles, indices};
        }
        _sphere.set(ctx.sculptLocalSym, ctx.sculptRadius);
        const trianglesSym = mesh.intersectSphere(_sphere);
        const indicesSym: number[] = [];
        visited.clear();
        for (let tri of trianglesSym) {
            for (let v = 0; v < 3; ++v) {
                const vertexIdx = mesh.sharedVertexMap[tri * 3 + v];
                if (!visited.has(vertexIdx)) {
                    visited.add(vertexIdx);
                    indicesSym.push(vertexIdx);
                }
            }
        }
        return {triangles, indices, trianglesSym, indicesSym};
    }

    sculptFalloff(dist: number) {
        return 3 * dist ** 4 - 4 * dist ** 3 + 1;
    }
}
