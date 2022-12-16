import {Box3, BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, Object3D, Ray, Sphere, Vector3} from 'three';
import OctreeNode from './OctreeNode';

const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _ab = new Vector3();
const _cb = new Vector3();
const _center = new Vector3();
const _n = new Vector3();

const SAME_VERTEX_JUDGMENT_ACCURACY = 1e-7;

function isSameVertex(a: Vector3, b: Vector3) {
    let ax = a.x;
    let ay = a.y;
    let az = a.z;
    let bx = b.x;
    let by = b.y;
    let bz = b.z;
    if (SAME_VERTEX_JUDGMENT_ACCURACY) {
        ax = Math.round(ax / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
        ay = Math.round(ay / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
        az = Math.round(az / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
        bx = Math.round(bx / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
        by = Math.round(by / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
        bz = Math.round(bz / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
    }
    return ax === bx && ay === by && az === bz;
}

export default class DynamicMesh {
    /** Triangle soup */
    aPosition: Float32Array = new Float32Array();
    /** Normals for each vertex */
    aNormal: Float32Array = new Float32Array();
    /** Midpoint of each triangle */
    triCenter: Float32Array = new Float32Array();
    /** AABB of each triangle */
    triBox: Float32Array = new Float32Array();
    /** Num of triangles */
    triNum: number = 0;
    /** Triangle vertex index to shared vertex index map */
    sharedVertexMap = new Uint32Array();
    /** Shared vertex index to all others related vertices indices */
    sharedVertexIndices = new Map<number, number[]>();
    /** Triangle edge index to neighbor triangle edge index map */
    edgeNeighborMap = new Uint32Array();
    /** Whether edge of triangle borders a hole */
    holes = new Uint8Array();
    octree: OctreeNode = new OctreeNode();

    /** Indices of triangles that were modified */
    private dirtyTriangles: Set<number> = new Set();

    buildFromTriangles(position: Float32Array) {
        const aPos = this.aPosition = new Float32Array(position.length);
        const aNormal = this.aNormal = new Float32Array(position.length);
        let triCount = 0;
        for (let tri = 0, len = position.length / 9; tri < len; ++tri) {
            _a.fromArray(position, tri * 9);
            _b.fromArray(position, tri * 9 + 3);
            _c.fromArray(position, tri * 9 + 6);
            // discard zero area triangles
            if (isSameVertex(_a, _b)
                || isSameVertex(_a, _c)
                || isSameVertex(_b, _c)
            ) {
                continue;
            }
            // copy position
            for (let k = 0; k < 9; ++k) {
                aPos[triCount * 9 + k] = position[tri * 9 + k];
            }
            // calculate normal
            _ab.subVectors(_a, _b);
            _cb.subVectors(_c, _b);
            _cb.cross(_ab).normalize();
            for (let k = 0; k < 3; ++k) {
                const j = triCount * 9 + k * 3;
                aNormal[j] = _cb.x;
                aNormal[j + 1] = _cb.y;
                aNormal[j + 2] = _cb.z;
            }
            triCount += 1;
        }
        if (triCount < position.length / 9) {
            this.aPosition = aPos.subarray(0, triCount * 9);
            this.aNormal = aNormal.subarray(0, triCount * 9);
            console.info(`Discard ${position.length / 9 - triCount} zero area triangles`);
        }
        this.init();
        return this.aPosition;
    }

    private init() {
        const position = this.aPosition;
        const triNum = this.triNum = position.length / 9;
        const triCenter = this.triCenter = new Float32Array(triNum * 3);
        const triBox = this.triBox = new Float32Array(triNum * 6);
        for (let tri = 0; tri < triNum; ++tri) {
            _a.fromArray(position, tri * 9);
            _b.fromArray(position, tri * 9 + 3);
            _c.fromArray(position, tri * 9 + 6);
            // calculate triangle midpoints
            _center.copy(_a).add(_b).add(_c).multiplyScalar(1 / 3);
            triCenter[tri * 3] = _center.x;
            triCenter[tri * 3 + 1] = _center.y;
            triCenter[tri * 3 + 2] = _center.z;
            // calculate triangle aabbs
            triBox[tri * 6] = Math.min(_a.x, _b.x, _c.x);
            triBox[tri * 6 + 1] = Math.min(_a.y, _b.y, _c.y);
            triBox[tri * 6 + 2] = Math.min(_a.z, _b.z, _c.z);
            triBox[tri * 6 + 3] = Math.max(_a.x, _b.x, _c.x);
            triBox[tri * 6 + 4] = Math.max(_a.y, _b.y, _c.y);
            triBox[tri * 6 + 5] = Math.max(_a.z, _b.z, _c.z);
        }
        this.buildTriangleNeighborEdgeMap();
        this.octree.build(this);
    }

    private buildTriangleNeighborEdgeMap() {
        // build triangle vertex index to shared vertex index map
        const triNum = this.triNum;
        const aPos = this.aPosition;
        const sharedVertexMap = this.sharedVertexMap = new Uint32Array(triNum * 3);
        const sharedVertexIndices = this.sharedVertexIndices;
        sharedVertexIndices.clear();
        const pointIdxMap = new Map<string, number>();
        for (let vertexIdx = 0, len = triNum * 3; vertexIdx < len; ++vertexIdx) {
            let vx = aPos[vertexIdx * 3];
            let vy = aPos[vertexIdx * 3 + 1];
            let vz = aPos[vertexIdx * 3 + 2];
            if (SAME_VERTEX_JUDGMENT_ACCURACY) {
                vx = Math.round(vx / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
                vy = Math.round(vy / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
                vz = Math.round(vz / SAME_VERTEX_JUDGMENT_ACCURACY) * SAME_VERTEX_JUDGMENT_ACCURACY;
            }
            const hash = `${vx},${vy},${vz}`;
            let sharedIdx = pointIdxMap.get(hash);
            if (sharedIdx == null) {
                sharedIdx = vertexIdx;
                pointIdxMap.set(hash, sharedIdx);
                sharedVertexIndices.set(sharedIdx, []);
            } else {
                sharedVertexIndices.get(sharedIdx)!.push(vertexIdx);
            }
            sharedVertexMap[vertexIdx] = sharedIdx;
        }
        // build shared vertex edge to triangle edge index map
        const sharedVertexEdgeToTriangleMap = new Map<string, number>();
        const zeroAreaTriangle = new Uint8Array(triNum);
        let duplicate = 0;
        let zeroTri = 0;
        for (let tri = 0; tri < triNum; ++tri) {
            let isZero = false;
            for (let edge = 0; edge < 3; ++edge) {
                const edgeIdx = tri * 3 + edge;
                const sharedVertex0 = sharedVertexMap[edgeIdx];
                const sharedVertex1 = sharedVertexMap[tri * 3 + ((edge + 1) % 3)];
                if (sharedVertex0 === sharedVertex1) {
                    isZero = true;
                    break;
                }
            }
            if (isZero) {
                zeroTri += 1;
                zeroAreaTriangle[tri] = 1;
                continue;
            }
            for (let edge = 0; edge < 3; ++edge) {
                const edgeIdx = tri * 3 + edge;
                const sharedVertex0 = sharedVertexMap[edgeIdx];
                const sharedVertex1 = sharedVertexMap[tri * 3 + ((edge + 1) % 3)];
                const hash = `${sharedVertex0},${sharedVertex1}`;
                const existed = sharedVertexEdgeToTriangleMap.get(hash);
                if (existed == null) {
                    sharedVertexEdgeToTriangleMap.set(hash, edgeIdx);
                } else {
                    duplicate += 1;
                }
            }
        }
        if (zeroTri) {
            console.warn(`Mesh has ${zeroTri} zero area triangles`);
        }
        if (duplicate) {
            console.warn(`Mesh has ${duplicate} duplicate edges`);
        }
        // build triangle neighbor edge map
        const edgeNeighborMap = this.edgeNeighborMap = new Uint32Array(triNum * 3);
        const holes = this.holes = new Uint8Array(triNum * 3);
        let edgesBorderHole = 0;
        for (let tri = 0; tri < triNum; ++tri) {
            if (zeroAreaTriangle[tri]) {
                continue;
            }
            for (let edge = 0; edge < 3; ++edge) {
                const edgeIdx = tri * 3 + edge;
                const sharedVertex0 = sharedVertexMap[edgeIdx];
                const sharedVertex1 = sharedVertexMap[tri * 3 + ((edge + 1) % 3)];
                const hash = `${sharedVertex0},${sharedVertex1}`;
                const neighborEdgeIdx = sharedVertexEdgeToTriangleMap.get(hash);
                if (neighborEdgeIdx == null) {
                    holes[edgeIdx] = 1;
                    edgesBorderHole += 1;
                } else {
                    edgeNeighborMap[edgeIdx] = neighborEdgeIdx;
                }
            }
        }
        if (edgesBorderHole) {
            console.warn(`Mesh has ${edgesBorderHole} edges border hole`);
        }
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
        outA.fromArray(this.aPosition, this.sharedVertexMap[i * 3] * 3);
        outB.fromArray(this.aPosition, this.sharedVertexMap[i * 3 + 1] * 3);
        outC.fromArray(this.aPosition, this.sharedVertexMap[i * 3 + 2] * 3);
    }

    getSharedVertex(out: Vector3, vertexIdx: number) {
        return out.fromArray(this.aPosition, this.sharedVertexMap[vertexIdx] * 3);
    }

    getVertex(out: Vector3, vertexIdx: number) {
        return out.fromArray(this.aPosition, vertexIdx * 3);
    }

    getNormal(out: Vector3, i: number) {
        out.fromArray(this.aNormal, i * 3 * 3);
        return out;
    }

    getAverageNormal(out: Vector3, triIndices: number[]) {
        out.set(0, 0, 0);
        for (let i of triIndices) {
            out.add(this.getNormal(_n, i));
        }
        return out.normalize();
    }

    getAverageCenter(out: Vector3, triIndices: number[]) {
        out.set(0, 0, 0);
        for (let i of triIndices) {
            out.add(this.getTriangleCenter(_center, i));
        }
        return out.divideScalar(triIndices.length);
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

    getVertexTriangleIndex(vertexIdx: number) {
        return (vertexIdx - (vertexIdx % 3)) / 3;
    }

    updateVertices(verticesIndices: number[], position: Float32Array) {
        const aPos = this.aPosition;
        for (let j = 0, len = verticesIndices.length; j < len; ++j) {
            const vertexIdx = this.sharedVertexMap[verticesIndices[j]];
            this.dirtyTriangles.add(this.getVertexTriangleIndex(vertexIdx));
            for (let c = 0; c < 3; ++c) {
                aPos[vertexIdx * 3 + c] = position[j * 3 + c];
            }
            const related = this.sharedVertexIndices.get(vertexIdx);
            if (related) {
                for (let v of related) {
                    this.dirtyTriangles.add(this.getVertexTriangleIndex(v));
                    for (let c = 0; c < 3; ++c) {
                        aPos[v * 3 + c] = position[j * 3 + c];
                    }
                }
            }
        }
    }

    update() {
        const indices = Array.from(this.dirtyTriangles);
        this.dirtyTriangles.clear();
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
