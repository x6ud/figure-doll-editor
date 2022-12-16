import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import DynamicMesh from '../utils/geometry/dynamic/DynamicMesh';
import EditorTool from './EditorTool';
import icon from './SculptBrush.png';

export default class SculptBrushTool extends EditorTool {
    label = 'Sculpt Brush';
    icon = icon;
    sculpt = true;

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
        const picking = this.getSculptPicking(ctx, mesh);
        let strength = this.brushStrength * ctx.detSec * (this.brushOperator ? 1 : -1) * 0.1;
        const center = new Vector3();
        const normal = new Vector3();
        ctx.history.updateVertices(
            node, picking.indices,
            this.stroke(
                mesh,
                picking.indices,
                strength,
                mesh.getAverageNormal(normal, picking.triangles),
                mesh.getAverageCenter(center, picking.triangles),
                ctx.sculptRadius
            )
        );
        if (ctx.sculptSym) {
            ctx.history.applyModifications();
            mesh.update();
            ctx.history.updateVertices(
                node, picking.indicesSym!,
                this.stroke(
                    mesh,
                    picking.indicesSym!,
                    strength,
                    mesh.getAverageNormal(normal, picking.trianglesSym!),
                    mesh.getAverageCenter(center, picking.trianglesSym!),
                    ctx.sculptRadius
                )
            );
        }
    }

    private stroke(
        mesh: DynamicMesh,
        indices: number[],
        strength: number,
        normal: Vector3,
        center: Vector3,
        radius: number,
    ) {
        const position = new Float32Array(indices.length * 3);
        const vertex = new Vector3();
        for (let j = 0, len = indices.length; j < len; ++j) {
            mesh.getVertex(vertex, indices[j]);
            this.strokeVertex(vertex, normal, center, radius, strength, position, j * 3);
        }
        return position;
    }

    private strokeVertex(vertex: Vector3,
                         normal: Vector3,
                         center: Vector3,
                         radius: number,
                         strength: number,
                         arr: Float32Array,
                         offset: number,
    ) {
        arr[offset] = vertex.x;
        arr[offset + 1] = vertex.y;
        arr[offset + 2] = vertex.z;
        const dist = vertex.distanceTo(center) / radius;
        if (dist >= 1) {
            return;
        }
        const det = this.sculptFalloff(dist) * strength;
        arr[offset] += normal.x * det;
        arr[offset + 1] += normal.y * det;
        arr[offset + 2] += normal.z * det;
    }
}
