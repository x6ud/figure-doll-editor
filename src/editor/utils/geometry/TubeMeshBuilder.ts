import {Vector2, Vector3} from 'three';
import {Tube} from '../../model/components/CTube';

const _det = new Vector3();
const _cross = new Vector3();
const _axis = new Vector3();
const _u = new Vector3();
const _v = new Vector3();

function makeRegular(seg: number, radius = 1) {
    const ret: Vector2[] = [];
    let x0 = 0;
    let y0 = radius;
    const detAngle = Math.PI * 2 / seg;
    const cos = Math.cos(detAngle);
    const sin = Math.sin(detAngle);
    for (let i = 0; i < seg; ++i) {
        const x1 = x0 * cos - y0 * sin;
        const y1 = x0 * sin + y0 * cos;
        ret.push(new Vector2(x0, y0), new Vector2(x1, y1));
        x0 = x1;
        y0 = y1;
    }
    return ret;
}

/**
 * Modified from https://github.com/huxingyi/dust3d/blob/master/dust3d/mesh/tube_mesh_builder.cc
 */
export default class TubeMeshBuilder {
    private tube: Tube;
    private directions: Vector3[] = [];
    private forwardDirections: Vector3[] = [];
    private forwardDistances: number[] = [];
    private baseNormal = new Vector3();
    private cutFaceVertices: Vector3[] = [];

    enableInterpolation: boolean = true;
    enableRoundingEnds: boolean = true;
    cutFace: Vector2[] = makeRegular(6);

    constructor(tube: Tube) {
        this.tube = [...tube];
    }

    build(): Vector3[] {
        if (this.tube.length === 1) {
            const node = this.tube[0];
            this.tube = [
                {
                    radius: node.radius,
                    position: new Vector3().copy(node.position).add(new Vector3(-node.radius / 3, 0, 0))
                },
                {
                    radius: node.radius,
                    position: new Vector3().copy(node.position).add(new Vector3(+node.radius / 3, 0, 0))
                }
            ];
        }
        this.applyInterpolation();
        this.applyRoundingEnds();
        this.calcDirections();
        this.calcBaseNormal();
        for (let i = 0; i < this.tube.length; ++i) {
            this.buildCutFaceVertices(this.tube[i].position, this.tube[i].radius, this.forwardDirections[i]);
        }
        const vertices: Vector3[] = [];
        if (!this.cutFaceVertices.length) {
            return vertices;
        }
        for (let j = 1; j + 1 < this.cutFace.length; ++j) {
            vertices.push(this.cutFaceVertices[j + 1]);
            vertices.push(this.cutFaceVertices[j]);
            vertices.push(this.cutFaceVertices[0]);
        }
        const cutFaceLen = this.cutFace.length;
        for (let j = 0, len = this.tube.length; j + 1 < len; ++j) {
            let bestOffset = 0;
            let maxDot = -1;
            const dir = this.directions[j];
            for (let offset = 0; offset < cutFaceLen; ++offset) {
                let dot = 1;
                for (let k = 0; k < cutFaceLen; ++k) {
                    const a = this.cutFaceVertices[j * cutFaceLen + k];
                    const b = this.cutFaceVertices[(j + 1) * cutFaceLen + (k + offset) % cutFaceLen];
                    _det.subVectors(b, a).normalize();
                    dot += _det.dot(dir);
                }
                if (dot > maxDot) {
                    bestOffset = offset;
                    maxDot = dot;
                }
            }
            for (let k = 0; k < cutFaceLen; ++k) {
                const a = this.cutFaceVertices[j * cutFaceLen + k];
                const b = this.cutFaceVertices[j * cutFaceLen + (k + 1) % cutFaceLen];
                const c = this.cutFaceVertices[(j + 1) * cutFaceLen + (k + bestOffset + 1) % cutFaceLen];
                const d = this.cutFaceVertices[(j + 1) * cutFaceLen + (k + bestOffset) % cutFaceLen];
                vertices.push(a, b, c, a, c, d);
            }
        }
        for (let j = 1, k = this.cutFaceVertices.length - this.cutFace.length; j + 1 < this.cutFace.length; ++j) {
            vertices.push(this.cutFaceVertices[k]);
            vertices.push(this.cutFaceVertices[k + j]);
            vertices.push(this.cutFaceVertices[k + j + 1]);
        }
        return vertices;
    }

    private applyInterpolation() {
        if (!this.enableInterpolation) {
            return;
        }
        if (this.tube.length <= 1) {
            return;
        }
        const tube: Tube = [this.tube[0]];
        for (let j = 1, len = this.tube.length; j < len; ++j) {
            const i = j - 1;
            _det.subVectors(this.tube[i].position, this.tube[j].position);
            const dist = _det.length();
            const distRadius = this.tube[i].radius + this.tube[j].radius;
            if (distRadius <= dist) {
                const seg = Math.floor(dist / distRadius);
                for (let k = 1; k < seg; ++k) {
                    const ratio = k / seg;
                    tube.push({
                        radius: this.tube[i].radius * (1 - ratio) + this.tube[j].radius * ratio,
                        position: new Vector3().copy(this.tube[i].position).multiplyScalar(1 - ratio)
                            .addScaledVector(this.tube[j].position, ratio)
                    });
                }
            }
            tube.push(this.tube[j]);
        }
        this.tube = tube;
    }

    private applyRoundingEnds() {
        if (this.tube.length <= 1) {
            return;
        }
        if (!this.enableRoundingEnds) {
            return;
        }
        this.tube.unshift({
            radius: this.tube[0].radius / 2,
            position: new Vector3()
                .subVectors(this.tube[0].position, this.tube[1].position)
                .normalize()
                .multiplyScalar(this.tube[0].radius / 2)
                .add(this.tube[0].position)
        });
        this.tube.push({
            radius: this.tube[this.tube.length - 1].radius / 2,
            position: new Vector3()
                .subVectors(this.tube[this.tube.length - 1].position, this.tube[this.tube.length - 2].position)
                .normalize()
                .multiplyScalar(this.tube[this.tube.length - 1].radius / 2)
                .add(this.tube[this.tube.length - 1].position)
        });
    }

    private calcDirections() {
        for (let node of this.tube) {
            this.directions.push(new Vector3());
            this.forwardDirections.push(new Vector3());
            this.forwardDistances.push(0);
        }
        const len = this.tube.length;
        if (len >= 2) {
            for (let j = 1; j < len; ++j) {
                const i = j - 1;
                const dir = this.directions[i].subVectors(this.tube[j].position, this.tube[i].position);
                this.forwardDistances[i] = dir.length();
                dir.normalize();
            }
            this.directions[len - 1].copy(this.directions[len - 2]);
            this.forwardDirections[0].copy(this.directions[0]);
            for (let j = 1; j + 1 < len; ++j) {
                const i = j - 1;
                this.forwardDirections[j]
                    .copy(this.directions[i]).multiplyScalar(this.forwardDistances[j])
                    .addScaledVector(this.directions[j], this.forwardDistances[i])
                    .normalize();
            }
            this.forwardDirections[len - 1].copy(this.directions[len - 1]);
        }
    }

    private calcBaseNormal() {
        const len = this.tube.length;
        for (let j = 1; j < len; ++j) {
            const i = j - 1;
            // angle = 15deg ~ 165deg
            if (Math.abs(this.directions[i].dot(this.directions[j])) < Math.cos(Math.PI / 180 * 15)) {
                _cross.copy(this.directions[i]).negate().cross(this.directions[j]);
                this.baseNormal.add(_cross);
            }
        }
        if (this.baseNormal.lengthSq() < 1e-8) {
            for (let i = 0; i + 1 < this.directions.length; ++i) {
                const sectionNormal = this.directions[i];
                // find nearest axis
                let axisIndex = 0;
                let sign = 1;
                let maxDot = -1;
                for (let i = 0; i < 3; ++i) {
                    _axis.set(0, 0, 0);
                    _axis.setComponent(i, 1);
                    let dot = _axis.dot(sectionNormal);
                    let positiveDot = Math.abs(dot);
                    if (positiveDot >= maxDot) {
                        sign = Math.sign(dot);
                        maxDot = positiveDot;
                        axisIndex = i;
                    }
                }
                // get next axis direction
                _axis.set(0, 0, 0);
                _axis.setComponent((i + 1) % 3, 1);
                _cross.crossVectors(sectionNormal, _axis).normalize().multiplyScalar(sign);
                this.baseNormal.add(_cross);
            }
        }
        this.baseNormal.normalize();
    }

    private buildCutFaceVertices(center: Vector3, radius: number, forwardDirection: Vector3) {
        _v.crossVectors(forwardDirection, this.baseNormal).normalize().multiplyScalar(radius);
        _u.crossVectors(_v, forwardDirection).normalize().multiplyScalar(radius);
        for (let i = 0, len = this.cutFace.length; i < len; ++i) {
            this.cutFaceVertices.push(
                new Vector3().copy(center)
                    .addScaledVector(_u, this.cutFace[i].x)
                    .addScaledVector(_v, this.cutFace[i].y)
            );
        }
    }
}
