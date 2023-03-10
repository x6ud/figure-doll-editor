import {BufferAttribute, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, Vector3} from 'three';

const _a0 = new Vector3();
const _b0 = new Vector3();
const _c0 = new Vector3();
const _d0 = new Vector3();
const _a1 = new Vector3();
const _b1 = new Vector3();
const _c1 = new Vector3();
const _d1 = new Vector3();
const _v = new Vector3();
const _nx = new Vector3();
const _ny = new Vector3();
const _dy = new Vector3();

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

export default class BoxEdge extends LineSegments {
    private point1 = new Vector3();
    private point2 = new Vector3();
    private normal1 = new Vector3();
    private normal2 = new Vector3();
    private length = 0;
    private width = 0;
    private height = 0;
    private dirty = false;

    constructor() {
        const geometry = new BufferGeometry();
        const vertices: number[] = new Array(12 * 2 * 3).fill(0);
        const colors: number[] = new Array(12 * 2 * 3).fill(1);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        const material = new LineBasicMaterial({
            vertexColors: true,
            toneMapped: false,
            color: 0xffff00,
        });
        super(geometry, material);
        this.type = 'BoxEdge';
    }

    setPoint1(point: Vector3) {
        if (this.point1.equals(point)) {
            return;
        }
        this.dirty = true;
        this.point1.copy(point);
    }

    setPoint2(point: Vector3) {
        if (this.point2.equals(point)) {
            return;
        }
        this.dirty = true;
        this.point2.copy(point);
    }

    setNormal1(normal: Vector3) {
        if (this.normal1.equals(normal)) {
            return;
        }
        this.dirty = true;
        this.normal1.copy(normal);
    }

    setNormal2(normal: Vector3) {
        if (this.normal2.equals(normal)) {
            return;
        }
        this.dirty = true;
        this.normal2.copy(normal);
    }

    setHeight(height: number) {
        if (height === this.height) {
            return;
        }
        this.dirty = true;
        this.height = height;
    }

    getLength() {
        return this.length;
    }

    getWidth() {
        return this.width;
    }

    updateGeometry() {
        if (!this.dirty) {
            return;
        }
        this.dirty = false;
        const position = this.geometry.attributes.position as BufferAttribute;
        const array = position.array as Float32Array;
        _a0.copy(this.point1);
        _c0.copy(this.point2);
        _nx.copy(this.normal1).normalize();
        _ny.crossVectors(this.normal1, this.normal2).normalize();
        _v.subVectors(_c0, _a0);
        _b0.copy(_a0).addScaledVector(_nx, this.width = _v.dot(_nx));
        _d0.copy(_a0).addScaledVector(_ny, this.length = _v.dot(_ny));
        _dy.copy(this.normal2).normalize().multiplyScalar(this.height);
        _a1.addVectors(_a0, _dy);
        _b1.addVectors(_b0, _dy);
        _c1.addVectors(_c0, _dy);
        _d1.addVectors(_d0, _dy);
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
