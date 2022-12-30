import {Matrix4, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import {linePanelIntersection} from '../utils/math';
import EditorTool, {SculptToolStroke} from './EditorTool';
import icon from './SculptDrag.png';

const _mouse1 = new Vector3();
const _det = new Vector3();
const _detSym = new Vector3();
const _v = new Vector3();

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/tools/Drag.js
export default class SculptDragTool extends EditorTool {
    label = 'Sculpt Move';
    icon = icon;
    sculpt = true;
    brushRadius = 100;
    brushStrength = 1;

    private nodeId: number = 0;
    private stroke0?: SculptToolStroke;
    private mouse0 = new Vector3();
    private local0 = new Vector3();
    private invMat = new Matrix4();

    begin(ctx: EditorContext) {
        if (ctx.sculptActiveView === -1) {
            this.nodeId = 0;
            this.stroke0 = undefined;
        }
    }

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

        const stroke = this.sculptPickStrokeVertices(ctx, node, view, mesh);
        if (stroke.track.length) {
            this.nodeId = node.id;
            this.stroke0 = stroke;
            this.mouse0.copy(this.stroke0.track[0].center).applyMatrix4(node.getWorldMatrix());
            this.local0.copy(this.stroke0.track[0].center);
            this.invMat.copy(node.getWorldMatrix()).invert();
        }
        if (this.nodeId !== node.id || !this.stroke0 || !this.stroke0.track.length) {
            this.nodeId = 0;
            this.stroke0 = undefined;
            return;
        }
        if (!linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, this.mouse0, view.mouseRayN)) {
            return;
        }
        _det.copy(_mouse1).applyMatrix4(this.invMat).sub(this.local0);
        const position = new Float32Array(this.stroke0.position);
        if (ctx.sculptSym) {
            _detSym.copy(_det);
            switch (ctx.options.symmetry) {
                case 'x':
                    _detSym.x *= -1;
                    break;
                case 'y':
                    _detSym.y *= -1;
                    break;
                case 'z':
                    _detSym.z *= -1;
                    break;
            }
        }
        this.stroke(
            this.stroke0.indices,
            this.brushStrength,
            ctx.sculptSym,
            _det,
            _detSym,
            this.stroke0.track[0].center,
            this.stroke0.track[0].centerSym,
            ctx.sculptLocalRadius,
            this.stroke0.offset,
            position
        );
        ctx.history.updateVertices(node, this.stroke0.indices, position);
    }

    private stroke(
        indices: number[],
        strength: number,
        sym: boolean,
        det: Vector3,
        detSym: Vector3 | undefined,
        center: Vector3,
        centerSym: Vector3 | undefined,
        radius: number,
        offset: Map<number, number>,
        arr: Float32Array,
    ) {
        for (let i of indices) {
            this.strokeVertex(sym, det, detSym, center, centerSym, radius, strength, arr, offset.get(i)!);
        }
    }

    private strokeVertex(
        sym: boolean,
        det: Vector3,
        detSym: Vector3 | undefined,
        center: Vector3,
        centerSym: Vector3 | undefined,
        radius: number,
        strength: number,
        arr: Float32Array,
        offset: number,
    ) {
        _v.fromArray(arr, offset);
        if (sym) {
            const dist0 = _v.distanceTo(center) / radius;
            const dist1 = _v.distanceTo(centerSym!) / radius;
            if (dist0 >= 1) {
                if (dist1 >= 1) {
                    return;
                }
                const s1 = this.sculptFalloff(dist1) * strength;
                arr[offset] += detSym!.x * s1;
                arr[offset + 1] += detSym!.y * s1;
                arr[offset + 2] += detSym!.z * s1;
            } else if (dist1 >= 1) {
                const s0 = this.sculptFalloff(dist0) * strength;
                arr[offset] += det.x * s0;
                arr[offset + 1] += det.y * s0;
                arr[offset + 2] += det.z * s0;
            } else {
                const t = (1 - dist0) + (1 - dist1);
                const s0 = this.sculptFalloff(dist0) * strength * (1 - dist0) / t;
                const s1 = this.sculptFalloff(dist1) * strength * (1 - dist1) / t;
                arr[offset] += det.x * s0 + detSym!.x * s1;
                arr[offset + 1] += det.y * s0 + detSym!.y * s1;
                arr[offset + 2] += det.z * s0 + detSym!.z * s1;
            }
        } else {
            const dist = _v.distanceTo(center) / radius;
            if (dist >= 1) {
                return;
            }
            const s = this.sculptFalloff(dist) * strength;
            arr[offset] += det.x * s;
            arr[offset + 1] += det.y * s;
            arr[offset + 2] += det.z * s;
        }
    }
}
