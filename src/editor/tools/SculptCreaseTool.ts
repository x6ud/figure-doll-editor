import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import EditorTool from './EditorTool';
import icon from './SculptCrease.png';

const _v = new Vector3();
const _n = new Vector3();

export default class SculptCreaseTool extends EditorTool {
    label = 'Sculpt Crease';
    icon = icon;
    sculpt = true;
    hasDirection = true;
    brushStrength = 0.25;
    brushStepSpacingRadiusRatio = 0.1;

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
        const strength = this.brushStrength * this.brushDirection;
        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh);
        const normal = new Vector3();
        for (let point of stroke.track) {
            this.stroke(
                point.indices,
                strength,
                mesh.getAverageNormal(normal, point.triangles),
                point.center,
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    point.indicesSym!,
                    strength,
                    mesh.getAverageNormal(normal, point.trianglesSym!),
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
        indices: number[],
        strength: number,
        normal: Vector3,
        center: Vector3,
        radius: number,
        offset: Map<number, number>,
        arr: Float32Array,
    ) {
        for (let i of indices) {
            this.strokeVertex(normal, center, radius, strength, arr, offset.get(i)!);
        }
    }

    private strokeVertex(normal: Vector3,
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
        const falloff = this.sculptFalloff(dist);
        const det1 = falloff ** 5 * strength * -0.01;
        arr[offset] += normal.x * det1;
        arr[offset + 1] += normal.y * det1;
        arr[offset + 2] += normal.z * det1;
        _v.fromArray(arr, offset);
        _n.subVectors(center, _v);
        const det2 = falloff * strength * 0.1;
        arr[offset] += _n.x * det2;
        arr[offset + 1] += _n.y * det2;
        arr[offset + 2] += _n.z * det2;
    }
}
