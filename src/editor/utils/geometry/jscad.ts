import {Geom3} from '@jscad/modeling/src/geometries/geom3';
import {Poly3} from '@jscad/modeling/src/geometries/poly3';
import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';

const _normal = new Vector3();
const DEFAULT_COLOR: [number, number, number] = [1, 1, 1];

export function geom3ToBufferGeometry(geom: Geom3) {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let index = 0;
    for (let poly of geom.polygons) {
        calculatePoly3Normal(_normal, poly);
        const color = poly.color || geom.color || DEFAULT_COLOR;
        for (let vertex of poly.vertices) {
            positions.push(...vertex);
            normals.push(_normal.x, _normal.y, _normal.z);
            colors.push(color[0], color[1], color[2]);
        }
        const len = poly.vertices.length;
        for (let i = 2; i < len; ++i) {
            indices.push(index, index + i - 1, index + i);
        }
        index += len;
    }
    return new BufferGeometry()
        .setAttribute('position', new Float32BufferAttribute(new Float32Array(positions), 3))
        .setAttribute('normal', new Float32BufferAttribute(new Float32Array(normals), 3))
        .setAttribute('color', new Float32BufferAttribute(new Float32Array(colors), 3))
        .setIndex(indices);
}

const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _ba = new Vector3();
const _ca = new Vector3();

function calculatePoly3Normal(out: Vector3, polygon: Poly3) {
    const vertices = polygon.vertices;
    _a.fromArray(vertices[0]);
    _b.fromArray(vertices[1]);
    _c.fromArray(vertices[2]);
    _ba.subVectors(_b, _a);
    _ca.subVectors(_c, _a);
    out.crossVectors(_ba, _ca);
    out.normalize();
    return out;
}
