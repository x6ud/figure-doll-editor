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
        let strength = this.brushStrength * ctx.detSec * (this.brushOperator ? 1 : -1);
        for (let j = 0, len = picking.indices.length; j < len; ++j) {
            const i = picking.indices[j];
            mesh.getTriangle(a, b, c, i);
            this.strokeVertex(a, true, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, j * 9);
            this.strokeVertex(b, true, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, j * 9 + 3);
            this.strokeVertex(c, true, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, j * 9 + 6);
        }
        if (ctx.sculptSym) {
            let offset = picking.indices.length * 9;
            for (let j = 0, len = picking.indicesSym.length; j < len; ++j) {
                const i = picking.indicesSym[j];
                mesh.getTriangle(a, b, c, i);
                this.strokeVertex(a, true, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9);
                this.strokeVertex(b, true, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9 + 3);
                this.strokeVertex(c, true, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9 + 6);
            }
            offset = (picking.indices.length + picking.indicesSym.length) * 9;
            for (let j = 0, len = picking.shared.length; j < len; ++j) {
                const i = picking.shared[j];
                mesh.getTriangle(a, b, c, i);
                this.strokeVertex(a, true, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, offset + j * 9);
                this.strokeVertex(a, false, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9);
                this.strokeVertex(b, true, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, offset + j * 9 + 3);
                this.strokeVertex(b, false, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9 + 3);
                this.strokeVertex(c, true, ctx.sculptNormal, ctx.sculptLocal, ctx.sculptRadius, strength, position, offset + j * 9 + 6);
                this.strokeVertex(c, false, ctx.sculptNormalSym, ctx.sculptLocalSym, ctx.sculptRadius, strength, position, offset + j * 9 + 6);
            }
        }
        ctx.history.setVertices(node, indices, position);
    }

    strokeVertex(vertex: Vector3,
                 copy: boolean,
                 normal: Vector3,
                 center: Vector3,
                 radius: number,
                 strength: number,
                 arr: Float32Array,
                 offset: number,
    ) {
        if (copy) {
            arr[offset] = vertex.x;
            arr[offset + 1] = vertex.y;
            arr[offset + 2] = vertex.z;
        }
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
