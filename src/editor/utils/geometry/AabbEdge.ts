import {
    Box3,
    BufferAttribute,
    BufferGeometry,
    Float32BufferAttribute,
    LineBasicMaterial,
    LineSegments,
    Vector3
} from 'three';

function vertex(buffer: Float32Array, i: number, v: Vector3) {
    buffer[i] = v.x;
    buffer[i + 1] = v.y;
    buffer[i + 2] = v.z;
    return i + 3;
}

function line(buffer: Float32Array, i: number, a: Vector3, b: Vector3) {
    i = vertex(buffer, i, a);
    return vertex(buffer, i, b);
}

const _a0 = new Vector3();
const _b0 = new Vector3();
const _c0 = new Vector3();
const _d0 = new Vector3();
const _a1 = new Vector3();
const _b1 = new Vector3();
const _c1 = new Vector3();
const _d1 = new Vector3();

export default class AabbEdge extends LineSegments {
    box = new Box3();

    constructor() {
        const geometry = new BufferGeometry();
        const vertices: number[] = new Array(12 * 2 * 3).fill(0);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        const material = new LineBasicMaterial({
            toneMapped: false,
            color: 0xffffff,
            transparent: true,
            opacity: 0.25
        });
        super(geometry, material);
        this.type = 'AabbEdge';
    }

    setBox(box: Box3) {
        if (this.box.equals(box)) {
            return;
        }
        this.box.copy(box);

        const dx = box.max.x - box.min.x;
        const dy = box.max.y - box.min.y;
        const dz = box.max.z - box.min.z;

        _a0.copy(box.min);
        _b0.copy(_a0);
        _b0.x += dx;
        _c0.copy(_a0);
        _c0.x += dx;
        _c0.z += dz;
        _d0.copy(_a0);
        _d0.z += dz;

        _a1.copy(_a0);
        _a1.y += dy;
        _b1.copy(_b0);
        _b1.y += dy;
        _c1.copy(_c0);
        _c1.y += dy;
        _d1.copy(_d0);
        _d1.y += dy;

        const position = this.geometry.attributes.position as BufferAttribute;
        const array = position.array as Float32Array;
        let i = 0;
        i = line(array, i, _a0, _b0);
        i = line(array, i, _b0, _c0);
        i = line(array, i, _c0, _d0);
        i = line(array, i, _d0, _a0);
        i = line(array, i, _a0, _a1);
        i = line(array, i, _b0, _b1);
        i = line(array, i, _c0, _c1);
        i = line(array, i, _d0, _d1);
        i = line(array, i, _a1, _b1);
        i = line(array, i, _b1, _c1);
        i = line(array, i, _c1, _d1);
        line(array, i, _d1, _a1);
        position.needsUpdate = true;
    }
}
