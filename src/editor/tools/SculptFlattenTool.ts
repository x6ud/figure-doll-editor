import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import CVertices from '../model/components/CVertices';
import EditorTool from './EditorTool';
import icon from './SculptFlatten.png';

const _v = new Vector3();
const _det = new Vector3();

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/tools/Flatten.js
export default class SculptFlattenTool extends EditorTool {
    label = 'Sculpt Flatten';
    icon = icon;
    sculpt = true;
    brushStrength = 0.2;
    hasDirection = true;
    hasThirdDirection = true;
    brushDirection = 0;
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
        const center = new Vector3();
        const normal = new Vector3();
        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh, this.frontFacesOnly);
        const pressure = ctx.options.enablePressure ? 1 : input.pressure;
        for (let point of stroke.track) {
            this.stroke(
                point.indices,
                this.brushStrength * pressure,
                mesh.getAverageNormal(normal, point.triangles),
                mesh.getAverageCenter(center, point.triangles),
                point.center,
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position
            );
            if (ctx.sculptSym) {
                this.stroke(
                    point.indicesSym!,
                    this.brushStrength * pressure,
                    mesh.getAverageNormal(normal, point.trianglesSym!),
                    mesh.getAverageCenter(center, point.trianglesSym!),
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
        normal: Vector3,
        center: Vector3,
        brushCenter: Vector3,
        radius: number,
        offset: Map<number, number>,
        arr: Float32Array,
    ) {
        for (let i of indices) {
            this.strokeVertex(normal, center, brushCenter, radius, strength, arr, offset.get(i)!);
        }
    }

    private strokeVertex(normal: Vector3,
                         center: Vector3,
                         brushCenter: Vector3,
                         radius: number,
                         strength: number,
                         arr: Float32Array,
                         offset: number,
    ) {
        _v.fromArray(arr, offset);
        const brushDist = _v.distanceTo(brushCenter) / radius;
        if (brushDist >= 1) {
            return;
        }
        const panelDist = _det.subVectors(center, _v).dot(normal);
        if (this.brushDirection === -Math.sign(panelDist)) {
            return;
        }
        const det = this.sculptFalloff(brushDist) * strength * panelDist;
        arr[offset] += normal.x * det;
        arr[offset + 1] += normal.y * det;
        arr[offset + 2] += normal.z * det;
    }
}
