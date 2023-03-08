import {Matrix4, Ray, Sphere, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CSymmetry from '../model/components/CSymmetry';
import ModelNode from '../model/ModelNode';
import DynamicMesh from '../utils/geometry/dynamic/DynamicMesh';
import {pixelLine} from '../utils/pixel';

const _sphere = new Sphere();
const _ray = new Ray();
const _invMat = new Matrix4();
const _n = new Vector3();

export type SculptToolStroke = {
    /** Indices of picked vertices */
    indices: number[],
    /** Vertex index to position buffer index map */
    offset: Map<number, number>,
    /** Position buffer for the vertices to be modified, filled with current vertices positions */
    position: Float32Array,
    /** Stroke track points */
    track: {
        /** Picking point in mesh's local space */
        center: Vector3,
        /** Picked triangle indices */
        triangles: number[],
        /** Picked vertices indices */
        indices: number[],
        /** Symmetry picking point in mesh's local space */
        centerSym?: Vector3,
        /** Picked symmetry triangle indices */
        trianglesSym?: number[],
        /** Picked symmetry vertices indices */
        indicesSym?: number[]
    }[]
};

export default abstract class EditorTool {
    abstract label: string;
    abstract icon: string;
    /** Is it a seperator */
    sep: boolean = false;
    /** Text set to status bar when tool is selected */
    tips: string = '';
    /** Whether to show transform controls */
    enableTransformControls: boolean = false;
    /** Whether to delete selected nodes when pressing delete */
    enableDefaultDeleteShortcut: boolean = true;
    /** Whether to show the selection rect when dragging */
    enableSelectionRect: boolean = false;
    /** Allow selecting nodes with selection rect */
    enableDefaultSelectionBehavior: boolean = false;
    /** Whether to show sculpting toolbar and brush indicator */
    sculpt: boolean = false;
    brushRadius: number = 50;
    brushStepSpacingRadiusRatio: number = 0.2;
    brushStrength: number = 0.5;
    hasDirection: boolean = false;
    hasThirdDirection: boolean = false;
    brushDirection: number = 1;
    brushHardness: number = 0.5;
    hasHardness: boolean = false;
    /** Whether to show color panel */
    hasColor: boolean = false;
    frontFacesOnly: boolean = false;
    /** Properties that need to be remembered */
    optionsProps: string[] = [];

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

    afterRender(ctx: EditorContext): void {
    }

    /** Called when tool is unselected */
    onUnselected(ctx: EditorContext): void {
    }

    /** Pick the vertices in brush sphere range and create a buffer for the vertices to be modified */
    sculptPickStrokeVertices(
        ctx: EditorContext,
        node: ModelNode,
        view: EditorView,
        mesh: DynamicMesh,
        backfaceCulling?: boolean
    ): SculptToolStroke {
        ctx = ctx.readonlyRef();
        _invMat.copy(node.getWorldMatrix()).invert();
        const vertexIndices = new Set<number>();
        const track: {
            center: Vector3,
            triangles: number[],
            indices: number[],
            centerSym?: Vector3,
            trianglesSym?: number[],
            indicesSym?: number[],
        }[] = [];
        const minSpacing = Math.max(1, Math.floor(this.brushRadius * this.brushStepSpacingRadiusRatio));
        if (ctx.sculptStartThisFrame) {
            ctx.sculptAccWalkedPixels = minSpacing;
        }
        const symmetry = node.value(CSymmetry);
        pixelLine(
            ctx.sculptX0, ctx.sculptY0, ctx.sculptX1, ctx.sculptY1,
            (x, y) => {
                // skip some pixels to avoid too heavy strokes
                ctx.sculptAccWalkedPixels += 1;
                if (ctx.sculptAccWalkedPixels < minSpacing) {
                    return;
                }
                ctx.sculptAccWalkedPixels = 0;
                // raycast mesh surface
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
                _sphere.set(result.point, ctx.sculptLocalRadius);
                // pick triangles in sphere
                const triangles = mesh.intersectSphere(_sphere);
                // list shared vertices indices from picked triangles
                const indices: number[] = [];
                const visited = new Set<number>();
                for (let tri of triangles) {
                    if (backfaceCulling) {
                        mesh.getNormal(_n, tri);
                        if (_n.dot(_ray.direction) >= 0) {
                            continue;
                        }
                    }
                    for (let v = 0; v < 3; ++v) {
                        const vertexIdx = mesh.sharedVertexMap[tri * 3 + v];
                        if (!visited.has(vertexIdx)) {
                            visited.add(vertexIdx);
                            indices.push(vertexIdx);
                            vertexIndices.add(vertexIdx);
                        }
                    }
                }
                switch (symmetry) {
                    case 'x':
                        _sphere.center.x *= -1;
                        _ray.direction.x *= -1;
                        break;
                    case 'y':
                        _sphere.center.y *= -1;
                        _ray.direction.y *= -1;
                        break;
                    case 'z':
                        _sphere.center.z *= -1;
                        _ray.direction.z *= -1;
                        break;
                    default: {
                        track.push({center: result.point, triangles, indices});
                        return;
                    }
                }
                const trianglesSym = mesh.intersectSphere(_sphere);
                const indicesSym: number[] = [];
                visited.clear();
                for (let tri of trianglesSym) {
                    if (backfaceCulling) {
                        mesh.getNormal(_n, tri);
                        if (_n.dot(_ray.direction) >= 0) {
                            continue;
                        }
                    }
                    for (let v = 0; v < 3; ++v) {
                        const vertexIdx = mesh.sharedVertexMap[tri * 3 + v];
                        if (!visited.has(vertexIdx)) {
                            visited.add(vertexIdx);
                            indicesSym.push(vertexIdx);
                            vertexIndices.add(vertexIdx);
                        }
                    }
                }
                track.push({
                    center: result.point, triangles, indices,
                    centerSym: new Vector3().copy(_sphere.center), trianglesSym, indicesSym
                });
                return;
            });
        const indices = Array.from(vertexIndices);
        const offset = new Map<number, number>();
        const position = new Float32Array(indices.length * 3);
        // copy current picked vertices positions
        for (let j = 0, len = indices.length; j < len; ++j) {
            const i = indices[j];
            for (let k = 0; k < 3; ++k) {
                position[j * 3 + k] = mesh.aPosition[i * 3 + k];
            }
            offset.set(i, j * 3);
        }
        return {indices, offset, position, track};
    }

    sculptFalloff(dist: number) {
        return (3 * dist - 4) * dist ** 3 + 1;
    }
}
