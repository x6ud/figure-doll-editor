import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import EditorTool from './EditorTool';
import icon from './SculptBrush.png';

const vertex = new Vector3();

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
        let strength = this.brushStrength * (this.brushOperator ? 1 : -1) * 0.01;
        const center = new Vector3();
        const normal = new Vector3();
        const stroke = this.sculptStroke(ctx, view, mesh);
        if (!stroke) {
            return;
        }
        for (let picking of stroke.track) {
            this.stroke(
                picking.indices,
                strength,
                mesh.getAverageNormal(normal, picking.triangles),
                mesh.getAverageCenter(center, picking.triangles),
                ctx.sculptRadius,
                stroke.bufIdxMap,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    picking.indicesSym!,
                    strength,
                    mesh.getAverageNormal(normal, picking.trianglesSym!),
                    mesh.getAverageCenter(center, picking.trianglesSym!),
                    ctx.sculptRadius,
                    stroke.bufIdxMap,
                    stroke.position
                );
            }
        }
        ctx.history.updateVertices(node, stroke.indices, stroke.position);
    }

    private stroke(
        indices: number[],
        strength: number,
        normal: Vector3,
        center: Vector3,
        radius: number,
        bufIdxMap: Map<number, number>,
        arr: Float32Array,
    ) {
        center.addScaledVector(normal, -radius * Math.sign(strength) * this.brushStrength * 0.5);
        for (let i of indices) {
            this.strokeVertex(normal, center, radius, strength, arr, bufIdxMap.get(i)! * 3);
        }
    }

    private strokeVertex(normal: Vector3,
                         center: Vector3,
                         radius: number,
                         strength: number,
                         arr: Float32Array,
                         offset: number,
    ) {
        vertex.x = arr[offset];
        vertex.y = arr[offset + 1];
        vertex.z = arr[offset + 2];
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
