import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import CVertices from '../model/components/CVertices';
import EditorTool from './EditorTool';
import icon from './SculptBrush.png';

const _v = new Vector3();

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/tools/Brush.js
export default class SculptBrushTool extends EditorTool {
    label = 'Sculpt Brush';
    icon = icon;
    sculpt = true;
    hasDirection = true;
    optionsProps = ['brushRadius', 'brushStrength', 'brushDirection', 'frontFacesOnly'];

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
        const pressure = ctx.options.enablePressure ? 1 : input.pressure;
        const strength = this.brushStrength * this.brushDirection * pressure * 0.01;
        const center = new Vector3();
        const normal = new Vector3();
        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh, this.frontFacesOnly);
        for (let point of stroke.track) {
            this.stroke(
                point.indices,
                strength,
                mesh.getAverageNormal(normal, point.triangles),
                mesh.getAverageCenter(center, point.triangles),
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    point.indicesSym!,
                    strength,
                    mesh.getAverageNormal(normal, point.trianglesSym!),
                    mesh.getAverageCenter(center, point.trianglesSym!),
                    ctx.sculptLocalRadius,
                    stroke.offset,
                    stroke.position
                );
            }
        }
        ctx.history.updateVertices(node, CVertices, stroke.indices, stroke.position);
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
        center.addScaledVector(normal, -radius * Math.sign(strength) * 0.5);
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
        const det = this.sculptFalloff(dist) * strength;
        arr[offset] += normal.x * det;
        arr[offset + 1] += normal.y * det;
        arr[offset + 2] += normal.z * det;
    }
}
