import {Matrix4, Ray, Sphere, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import DynamicMesh from '../utils/geometry/dynamic/DynamicMesh';
import {pixelLine} from '../utils/pixel';

const _sphere = new Sphere();
const _ray = new Ray();
const _invMat = new Matrix4();

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

    sculptStroke(ctx: EditorContext, view: EditorView, mesh: DynamicMesh) {
        ctx = ctx.readonlyRef();
        const vertexIndices = new Set<number>();
        const track: {
            center: Vector3,
            triangles: number[],
            indices: number[],
            trianglesSym?: number[],
            indicesSym?: number[],
        }[] = [];
        if (ctx.sculptStartThisFrame) {
            ctx.sculptAccWalkedPixels = 0;
        }
        pixelLine(
            ctx.sculptX0, ctx.sculptY0, ctx.sculptX1, ctx.sculptY1,
            (x, y) => {
                ctx.sculptAccWalkedPixels += 1;
                if (ctx.sculptAccWalkedPixels === 2) {
                    ctx.sculptAccWalkedPixels = 0;
                    return;
                }
                _ray.origin.set(x / view.width * 2 - 1, (view.height - y) / view.height * 2 - 1, -1);
                _ray.direction.copy(_ray.origin).setZ(+1);
                _ray.origin.unproject(view.camera.get());
                _ray.direction.unproject(view.camera.get());
                _ray.direction.sub(_ray.origin).normalize();
                _ray.applyMatrix4(_invMat);
                const result = mesh.raycast(_ray, true)[0];
                if (!result) {
                    return;
                }
                _sphere.set(result.point, ctx.sculptRadius);
                const triangles = mesh.intersectSphere(_sphere);
                const indices: number[] = [];
                const visited = new Set<number>();
                for (let tri of triangles) {
                    for (let v = 0; v < 3; ++v) {
                        const vertexIdx = mesh.sharedVertexMap[tri * 3 + v];
                        if (!visited.has(vertexIdx)) {
                            visited.add(vertexIdx);
                            indices.push(vertexIdx);
                            vertexIndices.add(vertexIdx);
                        }
                    }
                }
                if (!ctx.sculptSym) {
                    track.push({center: result.point, triangles, indices});
                    return;
                }
                switch (ctx.symmetry) {
                    case 'x':
                        _sphere.center.x *= -1;
                        break;
                    case 'y':
                        _sphere.center.y *= -1;
                        break;
                    case 'z':
                        _sphere.center.z *= -1;
                        break;
                }
                const trianglesSym = mesh.intersectSphere(_sphere);
                const indicesSym: number[] = [];
                visited.clear();
                for (let tri of trianglesSym) {
                    for (let v = 0; v < 3; ++v) {
                        const vertexIdx = mesh.sharedVertexMap[tri * 3 + v];
                        if (!visited.has(vertexIdx)) {
                            visited.add(vertexIdx);
                            indicesSym.push(vertexIdx);
                            vertexIndices.add(vertexIdx);
                        }
                    }
                }
                track.push({center: result.point, triangles, indices, trianglesSym, indicesSym});
                return;
            });
        const indices = Array.from(vertexIndices);
        const bufIdxMap = new Map<number, number>();
        const position = new Float32Array(indices.length * 3);
        for (let j = 0, len = indices.length; j < len; ++j) {
            const i = indices[j];
            for (let k = 0; k < 3; ++k) {
                position[j * 3 + k] = mesh.aPosition[i * 3 + k];
            }
            bufIdxMap.set(i, j);
        }
        return {indices, bufIdxMap, position, track};
    }

    sculptFalloff(dist: number) {
        return 3 * dist ** 4 - 4 * dist ** 3 + 1;
    }
}
