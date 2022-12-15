import {Box3, BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, Object3D, Ray, Sphere, Vector3} from 'three';
import OctreeNode from './OctreeNode';

const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _ab = new Vector3();
const _cb = new Vector3();
const _center = new Vector3();

export default class DynamicMesh {
    aPosition: Float32Array = new Float32Array();
    aNormal: Float32Array = new Float32Array();
    triCenter: Float32Array = new Float32Array();
    triBox: Float32Array = new Float32Array();
    triNum: number = 0;
    octree: OctreeNode = new OctreeNode();
    private dirtyIndices: Set<number> = new Set();

    buildFromTriangles(position: Float32Array, normal?: Float32Array) {
        this.aPosition = new Float32Array(position);
        if (normal) {
            this.aNormal = new Float32Array(normal);
        } else {
            const aNormal = this.aNormal = new Float32Array(position.length);
            for (let i = 0, vertNum = position.length / 3; i < vertNum; i += 3) {
                _a.fromArray(position, i * 3);
                _b.fromArray(position, (i + 1) * 3);
                _c.fromArray(position, (i + 2) * 3);
                _ab.subVectors(_a, _b);
                _cb.subVectors(_c, _b);
                _cb.cross(_ab).normalize();
                for (let k = 0; k < 3; ++k) {
                    const j = (i + k) * 3;
                    aNormal[j] = _cb.x;
                    aNormal[j + 1] = _cb.y;
                    aNormal[j + 2] = _cb.z;
                }
            }
        }
        this.init();
    }

    private init() {
        const position = this.aPosition;
        const triNum = this.triNum = position.length / 9;
        const triCenter = this.triCenter = new Float32Array(triNum * 3);
        const triBox = this.triBox = new Float32Array(triNum * 6);
        for (let i = 0, len = triNum; i < len; ++i) {
            _a.fromArray(position, i * 9);
            _b.fromArray(position, i * 9 + 3);
            _c.fromArray(position, i * 9 + 6);
            _center.copy(_a).add(_b).add(_c).multiplyScalar(1 / 3);
            triCenter[i * 3] = _center.x;
            triCenter[i * 3 + 1] = _center.y;
            triCenter[i * 3 + 2] = _center.z;
            triBox[i * 6] = Math.min(_a.x, _b.x, _c.x);
            triBox[i * 6 + 1] = Math.min(_a.y, _b.y, _c.y);
            triBox[i * 6 + 2] = Math.min(_a.z, _b.z, _c.z);
            triBox[i * 6 + 3] = Math.max(_a.x, _b.x, _c.x);
            triBox[i * 6 + 4] = Math.max(_a.y, _b.y, _c.y);
            triBox[i * 6 + 5] = Math.max(_a.z, _b.z, _c.z);
        }
        this.octree.build(this);
    }

    getTriangleCenter(out: Vector3, i: number) {
        out.fromArray(this.triCenter, i * 3);
        return out;
    }

    getTriangleBox(out: Box3, i: number) {
        out.min.fromArray(this.triBox, i * 6);
        out.max.fromArray(this.triBox, i * 6 + 3);
        return out;
    }

    getTriangle(outA: Vector3, outB: Vector3, outC: Vector3, i: number) {
        outA.fromArray(this.aPosition, i * 3 * 3);
        outB.fromArray(this.aPosition, (i * 3 + 1) * 3);
        outC.fromArray(this.aPosition, (i * 3 + 2) * 3);
    }

    getNormal(out: Vector3, i: number) {
        out.fromArray(this.aNormal, i * 3 * 3);
        return out;
    }

    toThree(obj?: Object3D): Object3D {
        if (obj) {
            const mesh = obj as Mesh;
            const position = mesh.geometry.getAttribute('position');
            position.needsUpdate = true;
            const normal = mesh.geometry.getAttribute('normal');
            normal.needsUpdate = true;
            mesh.geometry.computeBoundingSphere();
            return mesh;
        } else {
            return new Mesh(
                new BufferGeometry()
                    .setAttribute('position', new BufferAttribute(this.aPosition, 3))
                    .setAttribute('normal', new BufferAttribute(this.aNormal, 3)),
                new MeshStandardMaterial()
            );
        }
    }

    raycast(ray: Ray, backfaceCulling: boolean) {
        return this.octree.raycast(this, ray, backfaceCulling);
    }

    intersectSphere(sphere: Sphere) {
        return this.octree.intersectSphere(this, sphere);
    }

    setPosition(triIndices: number[], position: Float32Array) {
        const aPos = this.aPosition;
        for (let j = 0, len = triIndices.length; j < len; ++j) {
            const i = triIndices[j];
            for (let k = 0; k < 9; ++k) {
                aPos[i * 9 + k] = position[j * 9 + k];
            }
        }
        for (let i of triIndices) {
            this.dirtyIndices.add(i);
        }
    }

    update() {
        const indices = Array.from(this.dirtyIndices);
        this.dirtyIndices.clear();
        const position = this.aPosition;
        const normal = this.aNormal;
        const triCenter = this.triCenter;
        const triBox = this.triBox;
        for (let i of indices) {
            _a.fromArray(position, i * 9);
            _b.fromArray(position, i * 9 + 3);
            _c.fromArray(position, i * 9 + 6);
            _ab.subVectors(_a, _b);
            _cb.subVectors(_c, _b);
            _cb.cross(_ab).normalize();
            for (let k = 0; k < 3; ++k) {
                const j = i * 9 + k * 3;
                normal[j] = _cb.x;
                normal[j + 1] = _cb.y;
                normal[j + 2] = _cb.z;
            }
            _center.copy(_a).add(_b).add(_c).multiplyScalar(1 / 3);
            triCenter[i * 3] = _center.x;
            triCenter[i * 3 + 1] = _center.y;
            triCenter[i * 3 + 2] = _center.z;
            triBox[i * 6] = Math.min(_a.x, _b.x, _c.x);
            triBox[i * 6 + 1] = Math.min(_a.y, _b.y, _c.y);
            triBox[i * 6 + 2] = Math.min(_a.z, _b.z, _c.z);
            triBox[i * 6 + 3] = Math.max(_a.x, _b.x, _c.x);
            triBox[i * 6 + 4] = Math.max(_a.y, _b.y, _c.y);
            triBox[i * 6 + 5] = Math.max(_a.z, _b.z, _c.z);
        }
        this.octree.update(this, indices);
    }
}
