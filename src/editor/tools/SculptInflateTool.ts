import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import DynamicMesh from '../utils/geometry/dynamic/DynamicMesh';
import EditorTool from './EditorTool';
import icon from './SculptInflate.png';

const _v = new Vector3();
const _visited = new Set<number>();
const _n = new Vector3();
const _triN = new Vector3();
const _triC = new Vector3();

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/tools/Inflate.js
export default class SculptInflateTool extends EditorTool {
    label = 'Sculpt Inflate';
    icon = icon;
    sculpt = true;
    brushStrength = 0.2;

    update(ctx: EditorContext, view: EditorView) {
        ctx = ctx.readonlyRef();
        if (!ctx.sculptMoved) {
            return;
        }
        if (!ctx.sculptNodeId) {
            return;
        }
        if (view.index !== ctx.sculptActiveView) {
            return;
        }
        const input = view.input;
        if (!input.mouseLeft) {
            return;
        }
        if (input.isKeyPressed('Shift')) {
            return ctx.sculptSmoothTool.doStroke(ctx, view);
        }
        const node = ctx.model.getNode(ctx.sculptNodeId);
        const cObject3D = node.get(CObject3D);
        const mesh = cObject3D.mesh!;
        const strength = this.brushStrength * 0.01;
        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh);
        for (let point of stroke.track) {
            this.stroke(
                mesh,
                point.indices,
                strength,
                point.center,
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    mesh,
                    point.indicesSym!,
                    strength,
                    point.centerSym!,
                    ctx.sculptLocalRadius,
                    stroke.offset,
                    stroke.position
                );
            }
        }
        ctx.history.updateVertices(node, stroke.indices, stroke.position);
    }

    private stroke(
        mesh: DynamicMesh,
        indices: number[],
        strength: number,
        center: Vector3,
        radius: number,
        offset: Map<number, number>,
        arr: Float32Array,
    ) {
        for (let i of indices) {
            this.strokeVertex(mesh, i, center, radius, strength, arr, offset.get(i)!);
        }
    }

    private strokeVertex(mesh: DynamicMesh,
                         vertexIdx: number,
                         center: Vector3,
                         radius: number,
                         strength: number,
                         arr: Float32Array,
                         offset: number,
    ) {
        _v.fromArray(arr, offset);
        const dist = _v.distanceTo(center) / radius;
        if (dist >= 1) {
            return;
        }
        _n.set(0, 0, 0);
        let triIdx = mesh.getVertexTriangleIndex(mesh.edgeNeighborMap[vertexIdx]);
        const triIdx0 = triIdx;
        let loopSafe = 50;
        _visited.clear();
        do {
            _visited.add(triIdx);
            mesh.getNormal(_triN, triIdx);
            mesh.getTriangleCenter(_triC, triIdx);
            _n.addScaledVector(_triN, _v.distanceTo(_triC));

            // find next neighbour triangle
            const currTriIdx = triIdx;
            for (let edge = 0; edge < 3; ++edge) {
                const edgeIdx = triIdx * 3 + edge;
                if (mesh.holes[edgeIdx]) {
                    continue;
                }
                const tri2Idx = mesh.getVertexTriangleIndex(mesh.edgeNeighborMap[edgeIdx]);
                if (triIdx === tri2Idx || _visited.has(tri2Idx)) {
                    continue;
                }
                let found = false;
                for (let vertex = 0; vertex < 3; ++vertex) {
                    const vertexIdx2 = mesh.sharedVertexMap[tri2Idx * 3 + vertex];
                    if (vertexIdx2 === vertexIdx) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    triIdx = tri2Idx;
                    break;
                }
            }
            if (currTriIdx === triIdx) {
                // no unvisited neighbor found
                break;
            }
            if (loopSafe-- <= 0) {
                console.warn(`Loop limit reached`);
                break;
            }
        } while (triIdx0 !== triIdx);
        _n.normalize();
        const det = this.sculptFalloff(dist) * strength;
        arr[offset] += _n.x * det;
        arr[offset + 1] += _n.y * det;
        arr[offset + 2] += _n.z * det;
    }
}
