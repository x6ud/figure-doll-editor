import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import DynamicMesh from '../utils/geometry/dynamic/DynamicMesh';
import EditorTool from './EditorTool';
import icon from './SculptSmooth.png';

const _v = new Vector3();
const _v2 = new Vector3();
const _visited = new Set<number>();

export default class SculptSmoothTool extends EditorTool {
    label = 'Sculpt Smooth';
    icon = icon;
    sculpt = true;
    brushStrength = 1.0;
    brushRadius = 100;

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
        const node = ctx.model.getNode(ctx.sculptNodeId);
        const cObject3D = node.get(CObject3D);
        const mesh = cObject3D.mesh!;
        const stroke = this.sculptStroke(ctx, view, mesh);
        for (let picking of stroke.track) {
            this.stroke(
                mesh,
                picking.indices,
                this.brushStrength,
                picking.center,
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    mesh,
                    picking.indicesSym!,
                    this.brushStrength,
                    picking.centerSym!,
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
        let triIdx = mesh.getVertexTriangleIndex(mesh.edgeNeighborMap[vertexIdx]);
        const triIdx0 = triIdx;
        let weight = 0;
        let px = 0;
        let py = 0;
        let pz = 0;
        let loopSafe = 50;
        _visited.clear();
        do {
            _visited.add(triIdx);
            // accumulate neighbour vertices
            for (let vertex = 0; vertex < 3; ++vertex) {
                const vertexIdx2 = mesh.sharedVertexMap[triIdx * 3 + vertex];
                if (vertexIdx2 !== vertexIdx) {
                    mesh.getVertex(_v2, vertexIdx2);
                    const dist = _v2.distanceTo(_v);
                    px += _v2.x * dist;
                    py += _v2.y * dist;
                    pz += _v2.z * dist;
                    weight += dist;
                }
            }
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
                // neighbor not found
                break;
            }
            if (loopSafe-- <= 0) {
                console.warn(`Loop limit reached`);
                break;
            }
        } while (triIdx0 !== triIdx);
        weight = 1 / weight;
        px *= weight;
        py *= weight;
        pz *= weight;
        const det = this.sculptFalloff(dist) * strength;
        arr[offset] += (px - _v.x) * det;
        arr[offset + 1] += (py - _v.y) * det;
        arr[offset + 2] += (pz - _v.z) * det;
    }
}
