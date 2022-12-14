import {Box3, Vector3} from 'three';
import Bits from '../../../common/utils/Bits';
import {marchingCubes} from './marching-cubes';
import {mergeSmooth, roundCone, sphere, subtractSmooth} from './sdf';

interface SdfShape {
    /** Add or subtract */
    operator: boolean;
    /** Bounding box */
    bb: Box3;
    fatBb: Box3;

    createSymmetry(axis: number): SdfShape;

    sdf(x: number, y: number, z: number): number;
}

class SdfSphere implements SdfShape {
    position: Vector3;
    radius: number;
    operator: boolean;
    bb: Box3;
    fatBb: Box3 = new Box3();

    constructor(position: Vector3, radius: number, operator: boolean) {
        this.position = position;
        this.radius = radius;
        this.operator = operator;
        this.bb = new Box3().expandByPoint(position).expandByScalar(radius);
    }

    createSymmetry(axis: number): SdfShape {
        const position = new Vector3().copy(this.position);
        position.setComponent(axis, -position.getComponent(axis));
        return new SdfSphere(position, this.radius, this.operator);
    }

    sdf(x: number, y: number, z: number): number {
        return sphere(x, y, z, this.position.x, this.position.y, this.position.z, this.radius);
    }
}

class SdfRoundCone implements SdfShape {
    p1: Vector3;
    r1: number;
    p2: Vector3;
    r2: number;
    operator: boolean;
    bb: Box3;
    fatBb: Box3 = new Box3();

    constructor(p1: Vector3, r1: number, p2: Vector3, r2: number, operator: boolean) {
        this.p1 = p1;
        this.r1 = r1;
        this.p2 = p2;
        this.r2 = r2;
        this.operator = operator;
        this.bb = new Box3()
            .union(new Box3().expandByPoint(p1).expandByScalar(r1))
            .union(new Box3().expandByPoint(p2).expandByScalar(r2));
    }

    createSymmetry(axis: number): SdfShape {
        const p1 = new Vector3().copy(this.p1).setComponent(axis, -this.p1.getComponent(axis));
        const p2 = new Vector3().copy(this.p2).setComponent(axis, -this.p2.getComponent(axis));
        return new SdfRoundCone(p1, this.r1, p2, this.r2, this.operator);
    }

    sdf(x: number, y: number, z: number): number {
        return roundCone(x, y, z, this.p1.x, this.p1.y, this.p1.z, this.r1, this.p2.x, this.p2.y, this.p2.z, this.r2);
    }
}

const _p = new Vector3();

export default class SdfMeshBuilder {
    resolution = 0.005;
    maxResolutionSeg = 100;
    symmetryAxis = -1;
    smoothRange = 0.01;
    private shapes: SdfShape[] = [];

    sphere(position: Vector3, radius: number, operator: boolean) {
        if (radius <= 0) {
            return;
        }
        const shape = new SdfSphere(position, radius, operator);
        this.shapes.push(shape);
        if (this.symmetryAxis >= 0) {
            this.shapes.push(shape.createSymmetry(this.symmetryAxis));
        }
    }

    roundCone(p1: Vector3, r1: number, p2: Vector3, r2: number, operator: boolean) {
        if (r1 <= 0 && r2 <= 0) {
            return;
        }
        const dist = _p.subVectors(p1, p2).length();
        if (dist + Math.min(r1, r2) <= Math.max(r1, r2)) {
            if (r1 > r2) {
                return this.sphere(p1, r1, operator);
            } else {
                return this.sphere(p2, r2, operator);
            }
        }
        const shape = new SdfRoundCone(p1, r1, p2, r2, operator);
        this.shapes.push(shape);
        if (this.symmetryAxis >= 0) {
            this.shapes.push(shape.createSymmetry(this.symmetryAxis));
        }
    }

    build(): { position: number[], normal: number[] } {
        const bb = new Box3();
        for (let shape of this.shapes) {
            if (shape.operator) {
                bb.union(shape.bb);
            }
        }
        if (bb.isEmpty()) {
            return {position: [], normal: []};
        }
        bb.getSize(_p);
        let step = Math.max(this.resolution, Math.max(_p.x, _p.y, _p.z) / this.maxResolutionSeg);
        const smooth = this.smoothRange;
        for (let shape of this.shapes) {
            shape.fatBb.copy(shape.bb).expandByScalar(step + smooth);
        }
        const x0 = bb.min.x - step - smooth;
        const y0 = bb.min.y - step - smooth;
        const z0 = bb.min.z - step - smooth;
        const x1 = bb.max.x + step + smooth;
        const y1 = bb.max.y + step + smooth;
        const z1 = bb.max.z + step + smooth;
        const xRange = Math.ceil((x1 - x0) / step);
        const yRange = Math.ceil((y1 - y0) / step);
        const zRange = Math.ceil((z1 - z0) / step);
        const sample = new Float32Array(xRange * yRange * zRange);
        const mask = new Bits(sample.length);
        for (let ix = 0; ix < xRange; ++ix) {
            const x = x0 + ix * step;
            for (let iy = 0; iy < yRange; ++iy) {
                const y = y0 + iy * step;
                for (let iz = 0; iz < zRange; ++iz) {
                    const z = z0 + iz * step;
                    const index = ix * yRange * zRange + iy * zRange + iz;
                    for (let shape of this.shapes) {
                        if (!shape.fatBb.containsPoint(_p.set(x, y, z))) {
                            continue;
                        }
                        if (shape.operator) {
                            if (mask.get(index)) {
                                sample[index] = mergeSmooth(sample[index], shape.sdf(x, y, z), smooth);
                            } else {
                                mask.set(index);
                                sample[index] = shape.sdf(x, y, z);
                            }
                        } else {
                            if (!mask.get(index)) {
                                continue;
                            }
                            sample[index] = subtractSmooth(sample[index], shape.sdf(x, y, z), smooth);
                        }
                    }
                }
            }
        }
        const aPosition: number[] = [];
        const aNormal: number[] = [];
        for (let ix = 0; ix < xRange; ++ix) {
            const x = x0 + ix * step;
            for (let iy = 0; iy < yRange; ++iy) {
                const y = y0 + iy * step;
                for (let iz = 0; iz < zRange; ++iz) {
                    const z = z0 + iz * step;
                    if (!mask.get(ix * yRange * zRange + iy * zRange + iz)) {
                        continue;
                    }
                    marchingCubes(
                        aPosition, aNormal,
                        x, y, z,
                        step,
                        sample[ix * yRange * zRange + iy * zRange + iz],
                        sample[(ix + 1) * yRange * zRange + iy * zRange + iz],
                        sample[(ix + 1) * yRange * zRange + iy * zRange + (iz + 1)],
                        sample[ix * yRange * zRange + iy * zRange + (iz + 1)],
                        sample[ix * yRange * zRange + (iy + 1) * zRange + iz],
                        sample[(ix + 1) * yRange * zRange + (iy + 1) * zRange + iz],
                        sample[(ix + 1) * yRange * zRange + (iy + 1) * zRange + (iz + 1)],
                        sample[ix * yRange * zRange + (iy + 1) * zRange + (iz + 1)],
                    );
                }
            }
        }
        return {
            position: aPosition,
            normal: aNormal
        };
    }
}
