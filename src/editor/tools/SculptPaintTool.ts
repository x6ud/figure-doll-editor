import {Matrix4, Ray, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CColors from '../model/components/CColors';
import CObject3D from '../model/components/CObject3D';
import EditorTool from './EditorTool';
import icon from './SculptPaint.png';

const _v = new Vector3();
const _c0 = new Vector3();
const _c1 = new Vector3();
const _ray = new Ray();
const _invMat = new Matrix4();

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/tools/Paint.js
export default class SculptPaintTool extends EditorTool {
    label = 'Paint';
    icon = icon;
    tips = 'Press [P] to pick color';
    sculpt = true;
    brushRadius = 25;
    brushStrength = 1;
    hasHardness = true;
    hasColor = true;
    frontFacesOnly = true;
    optionsProps = ['brushRadius', 'brushStrength', 'brushHardness', 'frontFacesOnly'];

    update(ctx: EditorContext, view: EditorView) {
        if (!ctx.sculptNodeId) {
            return;
        }
        const input = view.input;
        if (input.pointerOver && input.isKeyPressed('p')) {
            // pick color
            const node = ctx.model.getNode(ctx.sculptNodeId);
            const cObject3D = node.get(CObject3D);
            const mesh = cObject3D.mesh!;
            _invMat.copy(node.getWorldMatrix()).invert();
            _ray.origin.copy(view.mouseRay0);
            _ray.direction.copy(view.mouseRayN);
            _ray.applyMatrix4(_invMat);
            const result = mesh.raycast(_ray, true)[0];
            if (result) {
                const tri = result.triangleIndex;
                _c0.set(0, 0, 0);
                _c0.add(_c1.fromArray(mesh.aColor, tri * 9));
                _c0.add(_c1.fromArray(mesh.aColor, tri * 9 + 3));
                _c0.add(_c1.fromArray(mesh.aColor, tri * 9 + 6));
                _c0.divideScalar(3);
                ctx.options.paintColor = [_c0.x, _c0.y, _c0.z];
            }
            return;
        }
        ctx = ctx.readonlyRef();
        if (!ctx.sculptMoved) {
            return;
        }
        if (view.index !== ctx.sculptActiveView) {
            return;
        }
        if (!input.mouseLeft) {
            return;
        }
        const node = ctx.model.getNode(ctx.sculptNodeId);
        const cObject3D = node.get(CObject3D);
        const mesh = cObject3D.mesh!;
        const pressure = ctx.options.enablePressure ? 1 : input.pressure;
        const strength = this.brushStrength * pressure;
        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh, this.frontFacesOnly);
        const colors = new Float32Array(stroke.position);
        for (let j = 0, len = stroke.indices.length; j < len; ++j) {
            const i = stroke.indices[j];
            for (let k = 0; k < 3; ++k) {
                colors[j * 3 + k] = mesh.aColor[i * 3 + k];
            }
        }
        _c1.set(ctx.options.paintColor[0], ctx.options.paintColor[1], ctx.options.paintColor[2]);
        for (let point of stroke.track) {
            this.stroke(
                point.indices,
                strength,
                point.center,
                ctx.sculptLocalRadius,
                stroke.offset,
                stroke.position,
                colors
            );
            if (ctx.sculptSym) {
                this.stroke(
                    point.indicesSym!,
                    strength,
                    point.centerSym!,
                    ctx.sculptLocalRadius,
                    stroke.offset,
                    stroke.position,
                    colors
                );
            }
        }
        ctx.history.updateVertices(node, CColors, stroke.indices, colors);
    }

    private stroke(
        indices: number[],
        strength: number,
        center: Vector3,
        radius: number,
        offset: Map<number, number>,
        position: Float32Array,
        color: Float32Array,
    ) {
        for (let i of indices) {
            this.strokeVertex(center, radius, strength, position, color, offset.get(i)!);
        }
    }

    private strokeVertex(center: Vector3,
                         radius: number,
                         strength: number,
                         position: Float32Array,
                         color: Float32Array,
                         offset: number,
    ) {
        _v.fromArray(position, offset);
        const dist = _v.distanceTo(center) / radius;
        if (dist >= 1) {
            return;
        }
        const falloff = Math.pow(1 - dist, 2 * (1 - this.brushHardness));
        const alpha = falloff * strength;
        _c0.fromArray(color, offset).lerp(_c1, alpha);
        color[offset] = _c0.x;
        color[offset + 1] = _c0.y;
        color[offset + 2] = _c0.z;
    }
}
