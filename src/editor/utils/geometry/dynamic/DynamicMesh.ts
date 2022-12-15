import {Box3, BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, Object3D, Ray, Vector3} from 'three';
import OctreeNode from './OctreeNode';

export default class DynamicMesh {
    aPosition: Float32Array = new Float32Array();
    aNormal: Float32Array = new Float32Array();
    triCenter: Float32Array = new Float32Array();
    triBox: Float32Array = new Float32Array();
    triNum: number = 0;
    octree: OctreeNode = new OctreeNode();

    buildFromTriangles(position: Float32Array, normal?: Float32Array) {
        this.aPosition = new Float32Array(position);
        if (normal) {
            this.aNormal = new Float32Array(normal);
        } else {
            const aNormal = this.aNormal = new Float32Array(position.length);
            const a = new Vector3();
            const b = new Vector3();
            const c = new Vector3();
            const ab = new Vector3();
            const cb = new Vector3();
            for (let i = 0, vertNum = position.length / 3; i < vertNum; i += 3) {
                a.fromArray(position, i * 3);
                b.fromArray(position, (i + 1) * 3);
                c.fromArray(position, (i + 2) * 3);
                ab.subVectors(a, b);
                cb.subVectors(c, b);
                cb.cross(ab).normalize();
                for (let k = 0; k < 3; ++k) {
                    const j = (i + k) * 3;
                    aNormal[j] = cb.x;
                    aNormal[j + 1] = cb.y;
                    aNormal[j + 2] = cb.z;
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
        const a = new Vector3();
        const b = new Vector3();
        const c = new Vector3();
        const center = new Vector3();
        for (let i = 0, len = triNum; i < len; ++i) {
            a.fromArray(position, i * 9);
            b.fromArray(position, i * 9 + 3);
            c.fromArray(position, i * 9 + 6);
            center.copy(a).add(b).add(c).multiplyScalar(1 / 3);
            triCenter[i * 3] = center.x;
            triCenter[i * 3 + 1] = center.y;
            triCenter[i * 3 + 2] = center.z;
            triBox[i * 6] = Math.min(a.x, b.x, c.x);
            triBox[i * 6 + 1] = Math.min(a.y, b.y, c.y);
            triBox[i * 6 + 2] = Math.min(a.z, b.z, c.z);
            triBox[i * 6 + 3] = Math.max(a.x, b.x, c.x);
            triBox[i * 6 + 4] = Math.max(a.y, b.y, c.y);
            triBox[i * 6 + 5] = Math.max(a.z, b.z, c.z);
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
}
