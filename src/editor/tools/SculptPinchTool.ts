import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import CVertices from '../model/components/CVertices';
import EditorTool from './EditorTool';
import icon from './SculptPinch.png';

const _v = new Vector3();
const _n = new Vector3();

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/tools/Pinch.js
export default class SculptPinchTool extends EditorTool {
    label = 'Sculpt Pinch';
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
        const strength = this.brushStrength * this.brushDirection * pressure * 0.1;
        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh, this.frontFacesOnly);
        for (let point of stroke.track) {
            this.stroke(
                point.indices,
                strength,
                point.center,
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    point.indicesSym!,
                    strength,
                    point.centerSym!,
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
        center: Vector3,
        radius: number,
        offset: Map<number, number>,
        arr: Float32Array,
    ) {
        for (let i of indices) {
            this.strokeVertex(center, radius, strength, arr, offset.get(i)!);
        }
    }

    private strokeVertex(center: Vector3,
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
        _n.subVectors(center, _v);
        const det = this.sculptFalloff(dist) * strength;
        arr[offset] += _n.x * det;
        arr[offset + 1] += _n.y * det;
        arr[offset + 2] += _n.z * det;
    }
}
