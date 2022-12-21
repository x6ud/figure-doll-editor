import {Box3, Vector3} from 'three';
import Bits from '../../../common/utils/Bits';
import {closestPointToTriangle, rayTriangleIntersect} from '../math';
import {marchingCubes} from './marching-cubes';

const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _ab = new Vector3();
const _ac = new Vector3();
const _bc = new Vector3();
const _p = new Vector3();
const _closestPoint = new Vector3();
const _det = new Vector3();
const _edgeDir = new Vector3(1, 0, 0);

// Modified from https://github.com/stephomi/sculptgl/blob/master/src/editing/Remesh.js
export function voxelizeRemesh(
    position: Float32Array,
    triBox: Float32Array,
    boundingBox: Box3,
    step: number = 0.005
) {
    const invStep = 1 / step;
    const triNum = position.length / 9;
    const x0 = boundingBox.min.x - step;
    const y0 = boundingBox.min.y - step;
    const z0 = boundingBox.min.z - step;
    const x1 = boundingBox.max.x + step;
    const y1 = boundingBox.max.y + step;
    const z1 = boundingBox.max.z + step;
    const ix0 = Math.floor(x0 * invStep);
    const iy0 = Math.floor(y0 * invStep);
    const iz0 = Math.floor(z0 * invStep);
    const ix1 = Math.ceil(x1 * invStep);
    const iy1 = Math.ceil(y1 * invStep);
    const iz1 = Math.ceil(z1 * invStep);
    const xRange = ix1 - ix0;
    const yRange = iy1 - iy0;
    const zRange = iz1 - iz0;
    const dataLen = xRange * yRange * zRange;
    const sdfSample = new Float32Array(dataLen);
    for (let i = 0; i < dataLen; ++i) {
        sdfSample[i] = step;
    }
    const mask = new Bits(dataLen);
    // whether cube edge crossed a triangle
    const crossed = new Bits(dataLen * 3);
    // sampling
    for (let tri = 0; tri < triNum; ++tri) {
        const tx0 = triBox[tri * 6];
        const ty0 = triBox[tri * 6 + 1];
        const tz0 = triBox[tri * 6 + 2];
        const tx1 = triBox[tri * 6 + 3];
        const ty1 = triBox[tri * 6 + 4];
        const tz1 = triBox[tri * 6 + 5];
        const tix0 = Math.floor(tx0 * invStep) - 1;
        const tiy0 = Math.floor(ty0 * invStep) - 1;
        const tiz0 = Math.floor(tz0 * invStep) - 1;
        const tix1 = Math.ceil(tx1 * invStep) + 1;
        const tiy1 = Math.ceil(ty1 * invStep) + 1;
        const tiz1 = Math.ceil(tz1 * invStep) + 1;
        const txRange = tix1 - tix0;
        const tyRange = tiy1 - tiy0;
        const tzRange = tiz1 - tiz0;
        _a.fromArray(position, tri * 9);
        _b.fromArray(position, tri * 9 + 3);
        _c.fromArray(position, tri * 9 + 6);
        _ab.subVectors(_b, _a);
        _ac.subVectors(_c, _a);
        _bc.subVectors(_c, _b);
        for (let tix = 0; tix < txRange; ++tix) {
            const ix = tix + tix0 - ix0;
            const x = x0 + ix * step;
            for (let tiy = 0; tiy < tyRange; ++tiy) {
                const iy = tiy + tiy0 - iy0;
                const y = y0 + iy * step;
                for (let tiz = 0; tiz < tzRange; ++tiz) {
                    const iz = tiz + tiz0 - iz0;
                    const z = z0 + iz * step;
                    const pointIdx = ix * yRange * zRange + iy * zRange + iz;
                    _p.set(x, y, z);
                    closestPointToTriangle(_closestPoint, _p, _a, _b, _c, _ab, _ac, _bc);
                    _det.subVectors(_closestPoint, _p);
                    const dist = _det.length();
                    if (dist > step) {
                        continue;
                    }
                    mask.set(pointIdx);
                    sdfSample[pointIdx] = Math.min(dist, sdfSample[pointIdx]);
                    // check if cube edge crossed the triangle
                    for (let axis = 0; axis < 3; ++axis) {
                        const det = _det.getComponent(axis);
                        if (det < 0 || det > step) {
                            continue;
                        }
                        const edgeIdx = pointIdx * 3 + axis;
                        if (crossed.get(edgeIdx)) {
                            continue;
                        }
                        _edgeDir.set(0, 0, 0);
                        _edgeDir.setComponent(axis, 1);
                        const dist = rayTriangleIntersect(_p, _edgeDir, _a, _ab, _ac);
                        if (dist < 0 || dist > step) {
                            continue;
                        }
                        crossed.set(edgeIdx);
                    }
                }
            }
        }
    }
    // check if sample point is outside mesh
    const outside = new Bits(sdfSample.length);
    const stack: number[] = [0];
    const idxDx = yRange * zRange;
    const idxDy = zRange;
    const idxDz = 1;
    const dirDet: number[] = [-idxDx, +idxDx, -idxDy, +idxDy, -idxDz, +idxDz];
    const dirAxis: number[] = [0, 0, 1, 1, 2, 2];
    while (stack.length) {
        const curr = stack.pop();
        if (curr == null) {
            break;
        }
        if (mask.get(curr)) {
            let isBorder = false;
            for (let dir = 0; dir < 6; ++dir) {
                const idxDet = dirDet[dir];
                const next = curr + idxDet;
                if (next < 0 || next >= dataLen) {
                    continue;
                }
                if (outside.get(next)) {
                    continue;
                }
                if (!mask.get(next)) {
                    continue;
                }
                if (crossed.get((idxDet > 0 ? curr : next) * 3 + dirAxis[dir])) {
                    isBorder = true;
                } else {
                    outside.set(next);
                    stack.push(next);
                }
            }
            if (isBorder) {
                outside.set(curr);
            }
        } else {
            outside.set(curr);
            for (let dir = 0; dir < 6; ++dir) {
                const next = curr + dirDet[dir];
                if (next < 0 || next >= dataLen) {
                    continue;
                }
                if (outside.get(next)) {
                    continue;
                }
                outside.set(next);
                stack.push(next);
            }
        }
    }
    // set sdf of points inside mesh to negative
    for (let i = 0; i < dataLen; ++i) {
        if (!outside.get(i)) {
            sdfSample[i] = -sdfSample[i];
        }
    }
    // marching cubes
    const aPosition: number[] = [];
    for (let ix = 0; ix < xRange - 1; ++ix) {
        const x = x0 + ix * step;
        for (let iy = 0; iy < yRange - 1; ++iy) {
            const y = y0 + iy * step;
            for (let iz = 0; iz < zRange - 1; ++iz) {
                const z = z0 + iz * step;
                marchingCubes(
                    aPosition, null,
                    x, y, z,
                    step,
                    sdfSample[ix * yRange * zRange + iy * zRange + iz],
                    sdfSample[(ix + 1) * yRange * zRange + iy * zRange + iz],
                    sdfSample[(ix + 1) * yRange * zRange + iy * zRange + (iz + 1)],
                    sdfSample[ix * yRange * zRange + iy * zRange + (iz + 1)],
                    sdfSample[ix * yRange * zRange + (iy + 1) * zRange + iz],
                    sdfSample[(ix + 1) * yRange * zRange + (iy + 1) * zRange + iz],
                    sdfSample[(ix + 1) * yRange * zRange + (iy + 1) * zRange + (iz + 1)],
                    sdfSample[ix * yRange * zRange + (iy + 1) * zRange + (iz + 1)],
                );
            }
        }
    }
    return new Float32Array(aPosition);
}
