import {BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, Vector3} from 'three';

const _o = new Vector3();
const _dx = new Vector3();
const _dy = new Vector3();
const _dz = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _d = new Vector3();
const _n = new Vector3();

function vertex(buffer: Float32Array, i: number, v: Vector3) {
    buffer[i] = v.x;
    buffer[i + 1] = v.y;
    buffer[i + 2] = v.z;
    return i + 3;
}

function face(aPos: Float32Array,
              aNormal: Float32Array,
              a: Vector3, b: Vector3, c: Vector3, d: Vector3,
              normal: Vector3
) {
    let i = 0;
    vertex(aPos, i, a);
    i = vertex(aNormal, i, normal);
    vertex(aPos, i, b);
    i = vertex(aNormal, i, normal);
    vertex(aPos, i, c);
    i = vertex(aNormal, i, normal);
    vertex(aPos, i, d);
    vertex(aNormal, i, normal);
}

export default class BoxFace extends Mesh {
    static readonly Right = 0;
    static readonly Left = 1;
    static readonly Top = 2;
    static readonly Bottom = 3;
    static readonly Front = 4;
    static readonly Back = 5;

    private size = new Vector3(1, 1, 1);
    private face = BoxFace.Right;
    private dirty = true;

    constructor() {
        const geometry = new BufferGeometry();
        const vertices = new Float32Array(4 * 3);
        const normals = new Float32Array(4 * 3);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        geometry.setIndex([0, 1, 3, 0, 3, 2]);
        const material = new MeshBasicMaterial({
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
            transparent: true,
            color: 0xffff00,
            opacity: 0.75
        });
        super(geometry, material);
        this.type = 'BoxFace';
    }

    setSize(size: Vector3) {
        if (this.size.equals(size)) {
            return;
        }
        this.dirty = true;
        this.size.copy(size);
    }

    setFace(face: number) {
        if (face === this.face) {
            return;
        }
        this.dirty = true;
        this.face = face;
    }

    getFace() {
        return this.face;
    }

    setFaceFromNormal(normal: Vector3) {
        if (normal.x < -1e-6) {
            this.setFace(BoxFace.Left);
        } else if (normal.x > 1e-6) {
            this.setFace(BoxFace.Right);
        } else if (normal.y < -1e-6) {
            this.setFace(BoxFace.Bottom);
        } else if (normal.y > 1e-6) {
            this.setFace(BoxFace.Top);
        } else if (normal.z < -1e-6) {
            this.setFace(BoxFace.Back);
        } else {
            this.setFace(BoxFace.Front);
        }
    }

    getFaceNormal(out: Vector3): Vector3 {
        switch (this.face) {
            case BoxFace.Left:
                out.set(-1, 0, 0);
                break;
            case BoxFace.Right:
                out.set(1, 0, 0);
                break;
            case BoxFace.Bottom:
                out.set(0, -1, 0);
                break;
            case BoxFace.Top:
                out.set(0, 1, 0);
                break;
            case BoxFace.Back:
                out.set(0, 0, -1);
                break;
            case BoxFace.Front:
                out.set(0, 0, 1);
                break;
        }
        return out;
    }

    getFaceTangent(out: Vector3): Vector3 {
        switch (this.face) {
            case BoxFace.Left:
                out.set(0, 0, -1);
                break;
            case BoxFace.Right:
                out.set(0, 0, 1);
                break;
            case BoxFace.Bottom:
                out.set(-1, 0, 0);
                break;
            case BoxFace.Top:
                out.set(1, 0, 0);
                break;
            case BoxFace.Back:
                out.set(0, -1, 0);
                break;
            case BoxFace.Front:
                out.set(0, 1, 0);
                break;
        }
        return out;
    }

    updateGeometry() {
        if (!this.dirty) {
            return;
        }
        this.dirty = false;
        _o.copy(this.size).multiplyScalar(-0.5);
        _dx.set(this.size.x, 0, 0);
        _dy.set(0, this.size.y, 0);
        _dz.set(0, 0, this.size.z);
        const position = this.geometry.attributes.position;
        const normal = this.geometry.attributes.normal;
        const aPos = position.array as Float32Array;
        const aNormal = normal.array as Float32Array;
        position.needsUpdate = true;
        normal.needsUpdate = true;
        switch (this.face) {
            case BoxFace.Left:
                _a.copy(_o);
                _b.copy(_o).add(_dz);
                _c.copy(_o).add(_dy);
                _d.copy(_o).add(_dz).add(_dy);
                _n.set(-1, 0, 0);
                break;
            case BoxFace.Right:
                _a.copy(_o).add(_dx);
                _b.copy(_o).add(_dy).add(_dx);
                _c.copy(_o).add(_dz).add(_dx);
                _d.copy(_o).add(_dz).add(_dy).add(_dx);
                _n.set(1, 0, 0);
                break;
            case BoxFace.Bottom:
                _a.copy(_o);
                _b.copy(_o).add(_dx);
                _c.copy(_o).add(_dz);
                _d.copy(_o).add(_dz).add(_dx);
                _n.set(0, -1, 0);
                break;
            case BoxFace.Top:
                _a.copy(_o).add(_dy);
                _b.copy(_o).add(_dz).add(_dy);
                _c.copy(_o).add(_dx).add(_dy);
                _d.copy(_o).add(_dz).add(_dx).add(_dy);
                _n.set(0, 1, 0);
                break;
            case BoxFace.Back:
                _a.copy(_o);
                _b.copy(_o).add(_dy);
                _c.copy(_o).add(_dx);
                _d.copy(_o).add(_dy).add(_dx);
                _n.set(0, 0, -1);
                break;
            case BoxFace.Front:
                _a.copy(_o).add(_dz);
                _b.copy(_o).add(_dx).add(_dz);
                _c.copy(_o).add(_dy).add(_dz);
                _d.copy(_o).add(_dy).add(_dx).add(_dz);
                _n.set(0, 0, 1);
                break;
        }
        face(aPos, aNormal, _a, _b, _c, _d, _n);
    }
}
