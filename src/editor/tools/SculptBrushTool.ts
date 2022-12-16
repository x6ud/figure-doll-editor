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
        let strength = this.brushStrength * ctx.detSec * (this.brushOperator ? 1 : -1);
        ctx.history.setVertices(
            node, picking.indices,
            this.stroke(mesh, picking.indices, strength, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius)
        );
        if (ctx.sculptSym) {
            ctx.history.applyModifications();
            mesh.update();
            ctx.history.setVertices(
                node, picking.indicesSym!,
                this.stroke(mesh, picking.indicesSym!, strength, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius)
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
        const position = new Float32Array(indices.length * 9);
        const a = new Vector3();
        const b = new Vector3();
        const c = new Vector3();
        for (let j = 0, len = indices.length; j < len; ++j) {
            const i = indices[j];
            mesh.getTriangle(a, b, c, i);
            this.strokeVertex(a, normal, center, radius, strength, position, j * 9);
            this.strokeVertex(b, normal, center, radius, strength, position, j * 9 + 3);
            this.strokeVertex(c, normal, center, radius, strength, position, j * 9 + 6);
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
