import {Box3, Ray, Sphere, Vector3} from 'three';
import DynamicMesh from './DynamicMesh';

const _triCenter = new Vector3();
const _triBox = new Box3();
const _splitBox = new Box3();
const _a = new Vector3();
const _b = new Vector3();
const _c = new Vector3();
const _p = new Vector3();

function constructChildren(mesh: DynamicMesh, node: OctreeNode) {
    node.isLeaf = false;
    if (node.depth >= OctreeNode.MAX_DEPTH) {
        node.isLeaf = true;
        return;
    }
    if (node.indices.length <= OctreeNode.MAX_TRI_PER_NODE) {
        node.isLeaf = true;
        return;
    }
    if (!node.indices.length) {
        node.isLeaf = true;
        return;
    }
    _splitBox.makeEmpty();
    for (let i of node.indices) {
        _splitBox.expandByPoint(mesh.getTriangleCenter(_triCenter, i));
    }
    node.splitCenter.copy(_splitBox.min).add(_splitBox.max).multiplyScalar(0.5);
    node.children.length = 0;
    for (let i = 0; i < 8; ++i) {
        const child = new OctreeNode();
        child.depth = node.depth + 1;
        node.children.push(child);
    }
    for (let i of node.indices) {
        mesh.getTriangleCenter(_triCenter, i);
        if (_triCenter.x < node.splitCenter.x) {
            if (_triCenter.y < node.splitCenter.y) {
                if (_triCenter.z < node.splitCenter.z) {
                    node.children[0].indices.push(i);
                } else {
                    node.children[1].indices.push(i);
                }
            } else {
                if (_triCenter.z < node.splitCenter.z) {
                    node.children[2].indices.push(i);
                } else {
                    node.children[3].indices.push(i);
                }
            }
        } else {
            if (_triCenter.y < node.splitCenter.y) {
                if (_triCenter.z < node.splitCenter.z) {
                    node.children[4].indices.push(i);
                } else {
                    node.children[5].indices.push(i);
                }
            } else {
                if (_triCenter.z < node.splitCenter.z) {
                    node.children[6].indices.push(i);
                } else {
                    node.children[7].indices.push(i);
                }
            }
        }
    }
}

export default class OctreeNode {
    static readonly MAX_DEPTH = 8;
    static readonly MAX_TRI_PER_NODE = 100;

    depth: number = 1;
    children: OctreeNode[] = [];
    box: Box3 = new Box3();
    splitCenter: Vector3 = new Vector3();
    isLeaf: boolean = false;
    indices: number[] = [];

    build(mesh: DynamicMesh) {
        this.indices.length = 0;
        for (let i = 0; i < mesh.triNum; ++i) {
            this.indices.push(i);
        }
        const stack: OctreeNode[] = [this];
        while (stack.length) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            node.recomputeBox(mesh);
            constructChildren(mesh, node);
            if (!node.isLeaf) {
                stack.push(...node.children);
            }
        }
    }

    private recomputeBox(mesh: DynamicMesh) {
        this.box.makeEmpty();
        for (let i of this.indices) {
            this.box.union(mesh.getTriangleBox(_triBox, i));
        }
        this.box.expandByScalar(1e-7);
    }

    update(mesh: DynamicMesh, indices: number[]) {
        if (!indices.length) {
            return;
        }
        const dirtyNodes: Set<OctreeNode> = new Set();
        {
            const stack: OctreeNode[] = [this];
            while (stack.length) {
                const node = stack.pop();
                if (!node) {
                    break;
                }
                let needsUpdate = false;
                for (let i of indices) {
                    const j = node.indices.indexOf(i);
                    if (j >= 0) {
                        needsUpdate = true;
                        node.indices.splice(j, 1);
                    }
                }
                if (needsUpdate) {
                    if (node.indices.length) {
                        dirtyNodes.add(node);
                        stack.push(...node.children);
                    } else {
                        node.box.makeEmpty();
                        node.isLeaf = true;
                        node.children.length = 0;
                    }
                }
            }
        }
        {
            const stack: [OctreeNode, number[]][] = [[this, indices]];
            while (stack.length) {
                const pair = stack.pop();
                if (!pair) {
                    break;
                }
                const node = pair[0];
                const indices = pair[1];
                dirtyNodes.add(node);
                node.indices.push(...indices);
                if (node.isLeaf) {
                    if (node.indices.length <= OctreeNode.MAX_TRI_PER_NODE
                        || node.depth >= OctreeNode.MAX_DEPTH
                    ) {
                        continue;
                    }
                    const stack: OctreeNode[] = [node];
                    while (stack.length) {
                        const node = stack.pop();
                        if (!node) {
                            break;
                        }
                        node.recomputeBox(mesh);
                        constructChildren(mesh, node);
                        if (!node.isLeaf) {
                            stack.push(...node.children);
                        }
                    }
                    continue;
                }
                const arr0: number[] = [];
                const arr1: number[] = [];
                const arr2: number[] = [];
                const arr3: number[] = [];
                const arr4: number[] = [];
                const arr5: number[] = [];
                const arr6: number[] = [];
                const arr7: number[] = [];
                for (let i of indices) {
                    mesh.getTriangleCenter(_triCenter, i);
                    if (_triCenter.x < node.splitCenter.x) {
                        if (_triCenter.y < node.splitCenter.y) {
                            if (_triCenter.z < node.splitCenter.z) {
                                arr0.push(i);
                            } else {
                                arr1.push(i);
                            }
                        } else {
                            if (_triCenter.z < node.splitCenter.z) {
                                arr2.push(i);
                            } else {
                                arr3.push(i);
                            }
                        }
                    } else {
                        if (_triCenter.y < node.splitCenter.y) {
                            if (_triCenter.z < node.splitCenter.z) {
                                arr4.push(i);
                            } else {
                                arr5.push(i);
                            }
                        } else {
                            if (_triCenter.z < node.splitCenter.z) {
                                arr6.push(i);
                            } else {
                                arr7.push(i);
                            }
                        }
                    }
                }
                if (arr0.length) {
                    stack.push([node.children[0], arr0]);
                }
                if (arr1.length) {
                    stack.push([node.children[1], arr1]);
                }
                if (arr2.length) {
                    stack.push([node.children[2], arr2]);
                }
                if (arr3.length) {
                    stack.push([node.children[3], arr3]);
                }
                if (arr4.length) {
                    stack.push([node.children[4], arr4]);
                }
                if (arr5.length) {
                    stack.push([node.children[5], arr5]);
                }
                if (arr6.length) {
                    stack.push([node.children[6], arr6]);
                }
                if (arr7.length) {
                    stack.push([node.children[7], arr7]);
                }
            }
        }
        for (let node of dirtyNodes) {
            node.recomputeBox(mesh);
        }
    }

    raycast(mesh: DynamicMesh, ray: Ray, backfaceCulling: boolean) {
        const ret: { point: Vector3, normal: Vector3, triangleIndex: number, distance: number }[] = [];
        const stack: OctreeNode[] = [this];
        const irx = 1 / ray.direction.x;
        const iry = 1 / ray.direction.y;
        const irz = 1 / ray.direction.z;
        while (stack.length) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            const tx0 = (node.box.min.x - ray.origin.x) * irx;
            const tx1 = (node.box.max.x - ray.origin.x) * irx;
            const ty0 = (node.box.min.y - ray.origin.y) * iry;
            const ty1 = (node.box.max.y - ray.origin.y) * iry;
            const tz0 = (node.box.min.z - ray.origin.z) * irz;
            const tz1 = (node.box.max.z - ray.origin.z) * irz;
            const tMin = Math.max(Math.min(tx0, tx1), Math.min(ty0, ty1), Math.min(tz0, tz1));
            const tMax = Math.min(Math.max(tx0, tx1), Math.max(ty0, ty1), Math.max(tz0, tz1));
            if (tMax < 0 || tMin > tMax) {
                continue;
            }
            if (node.isLeaf) {
                for (let i of node.indices) {
                    mesh.getTriangle(_a, _b, _c, i);
                    const hit = ray.intersectTriangle(_a, _b, _c, backfaceCulling, _p);
                    if (hit) {
                        const point = new Vector3().copy(hit);
                        const normal = mesh.getNormal(new Vector3(), i);
                        const distance = ray.origin.distanceTo(point);
                        ret.push({
                            point, normal, distance, triangleIndex: i
                        });
                    }
                }
            } else {
                stack.push(...node.children);
            }
        }
        return ret.sort((a, b) => a.distance - b.distance);
    }

    intersectSphere(mesh: DynamicMesh, sphere: Sphere) {
        const stack: OctreeNode[] = [this];
        const ret: number[] = [];
        while (stack.length) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            if (!node.box.intersectsSphere(sphere)) {
                continue;
            }
            if (node.isLeaf) {
                for (let i of node.indices) {
                    mesh.getTriangleBox(_triBox, i);
                    if (_triBox.intersectsSphere(sphere)) {
                        ret.push(i);
                    }
                }
            } else {
                stack.push(...node.children);
            }
        }
        return ret;
    }
}
