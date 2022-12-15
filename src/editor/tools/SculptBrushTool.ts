import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
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
        const indices = [...picking.indices, ...picking.indicesSym, ...picking.shared];
        const position = new Float32Array(indices.length * 9);
        const a = new Vector3();
        const b = new Vector3();
        const c = new Vector3();
        const strength = this.brushStrength * ctx.detSec;
        for (let j = 0, len = picking.indices.length; j < len; ++j) {
            const i = picking.indices[j];
            mesh.getTriangle(a, b, c, i);
            this.strokeVertex(a, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, j * 9);
            this.strokeVertex(b, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, j * 9 + 3);
            this.strokeVertex(c, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, j * 9 + 6);
        }
        if (ctx.sculptSym) {
            let offset = picking.indices.length * 9;
            for (let j = 0, len = picking.indicesSym.length; j < len; ++j) {
                const i = picking.indicesSym[j];
                mesh.getTriangle(a, b, c, i);
                this.strokeVertex(a, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9);
                this.strokeVertex(b, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9 + 3);
                this.strokeVertex(c, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9 + 6);
            }
            offset = (picking.indices.length + picking.indicesSym.length) * 9;
            const normal = new Vector3().copy(ctx.sculptNormal).add(ctx.sculptNormalSym).normalize();
            const center = new Vector3().copy(ctx.sculptLocal).add(ctx.sculptLocalSym).multiplyScalar(0.5);
            for (let j = 0, len = picking.shared.length; j < len; ++j) {
                const i = picking.shared[j];
                mesh.getTriangle(a, b, c, i);
                this.strokeVertex(a, normal, center, ctx.sculptRadius, strength, position, offset + j * 9);
                this.strokeVertex(b, normal, center, ctx.sculptRadius, strength, position, offset + j * 9 + 3);
                this.strokeVertex(c, normal, center, ctx.sculptRadius, strength, position, offset + j * 9 + 6);
            }
        }
        ctx.history.setVertices(node, indices, position);
    }

    strokeVertex(vertex: Vector3,
                 normal: Vector3,
                 center: Vector3,
                 radius: number,
                 strength: number,
                 arr: Float32Array,
                 offset: number
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
