import {
    BufferAttribute,
    BufferGeometry,
    Float32BufferAttribute,
    Group,
    InterleavedBufferAttribute,
    Mesh,
    Vector3
} from 'three';
import EditorContext from '../EditorContext';
import CFlipDirection from '../model/components/CFlipDirection';
import CObject3D, {Object3DUserData} from '../model/components/CObject3D';
import CVisible from '../model/components/CVisible';
import ModelNode from '../model/ModelNode';
import UpdateSystem from '../utils/UpdateSystem';

export interface ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void;
}

const _dirtyNodes: ModelNode[] = [];
const _v = new Vector3();

export default class ModelUpdateSystem extends UpdateSystem<EditorContext> {

    private readonly filters: ModelNodeUpdateFilter[];

    constructor(filters: ModelNodeUpdateFilter[]) {
        super();
        this.filters = filters;
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (ctx.model.dirty) {
            ctx.model.forEach(node => {
                if (node.parent && !node.parent.visible) {
                    node.visible = false;
                } else {
                    node.visible = node.has(CVisible) ? node.value(CVisible) : true;
                }
                if (node.dirty) {
                    _dirtyNodes.push(node);
                }
            });
            for (let filter of this.filters) {
                for (let node of _dirtyNodes) {
                    filter.update(ctx, node);
                }
            }
            for (let node of _dirtyNodes) {
                node.dirty = false;
            }
            _dirtyNodes.length = 0;
            ctx.model.dirty = false;
        }
        if (ctx.model.instanceDirty) {
            ctx.model.instanceDirty = false;
            ctx.model.forEach(node => {
                if (node.instanceId && node.instanceMeshDirty) {
                    node.instanceMeshDirty = false;
                    if (node.instanceMeshRebuild) {
                        node.instanceMeshRebuild = false;
                        this.recreateInstanceMesh(ctx, node);
                    }
                    this.updateInstanceMirrorGeometry(ctx, node);
                }
            });
            ctx.model.dirty = true;
        }
    }

    end(ctx: EditorContext): void {
    }

    private recreateInstanceMesh(ctx: EditorContext, node: ModelNode) {
        if (!node.has(CObject3D)) {
            return;
        }
        const cObject3D = node.get(CObject3D);
        cObject3D.dispose();
        if (!ctx.model.isNodeExists(node.instanceId)) {
            return;
        }
        const target = ctx.model.getNode(node.instanceId);
        const obj = target.value(CObject3D);
        if (!obj) {
            return;
        }
        if ((obj as Group).isGroup) {
            const group = obj as Group;
            const instanceGroup = cObject3D.value = new Group();
            (instanceGroup.userData as Object3DUserData).node = node;
            for (let child of group.children) {
                if ((child as Mesh).isMesh) {
                    const mesh = child as Mesh;
                    const newMesh = new Mesh(mesh.geometry, mesh.material);
                    (newMesh.userData as Object3DUserData).node = node;
                    instanceGroup.add(newMesh);
                }
            }
        } else if ((obj as Mesh).isMesh) {
            const mesh = obj as Mesh;
            const newMesh = cObject3D.value = new Mesh(mesh.geometry, mesh.material);
            (newMesh.userData as Object3DUserData).node = node;
        }
        node.dirty = true;
        cObject3D.parentChanged = true;
        cObject3D.localTransformChanged = true;
        cObject3D.worldTransformChanged = true;
    }

    private updateInstanceMirrorGeometry(ctx: EditorContext, node: ModelNode) {
        if (!node.has(CFlipDirection)) {
            return;
        }
        const flipDir = node.value(CFlipDirection);
        const obj = node.value(CObject3D);
        if (!obj) {
            return;
        }
        const target = ctx.model.getNode(node.instanceId).value(CObject3D);
        if (!target) {
            return;
        }
        if ((obj as Group).isGroup) {
            for (let i = 0, len = obj.children.length; i < len; ++i) {
                this.mirrorMesh(obj.children[i] as Mesh, target.children[i] as Mesh, flipDir);
            }
        } else {
            this.mirrorMesh(obj as Mesh, target as Mesh, flipDir);
        }
    }

    private mirrorMesh(dst: Mesh, src: Mesh, flipDir: Vector3) {
        if (!dst?.geometry || !src?.geometry) {
            return;
        }
        if (dst.geometry === src.geometry) {
            dst.geometry = new BufferGeometry();
            const aPos = src.geometry.getAttribute('position');
            if (aPos) {
                dst.geometry.setAttribute('position', new Float32BufferAttribute(
                    new Float32Array(aPos.array as ArrayLike<number>),
                    aPos.itemSize
                ));
            }
            const aNormal = src.geometry.getAttribute('normal');
            if (aNormal) {
                dst.geometry.setAttribute('normal', new Float32BufferAttribute(
                    new Float32Array(aNormal.array as ArrayLike<number>),
                    aNormal.itemSize
                ));
            }
        }
        this.mirrorGeometry(dst.geometry, src.geometry, flipDir);
    }

    private mirrorGeometry(dst: BufferGeometry, src: BufferGeometry, flipDir: Vector3) {
        this.mirrorAttribute(dst.getAttribute('position'), src.getAttribute('position'), flipDir);
        this.mirrorAttribute(dst.getAttribute('normal'), src.getAttribute('normal'), flipDir);
    }

    private mirrorAttribute(dst: BufferAttribute | InterleavedBufferAttribute,
                            src: BufferAttribute | InterleavedBufferAttribute,
                            flipDir: Vector3
    ) {
        if (!dst || !src) {
            return;
        }
        if (dst.itemSize !== 3) {
            return;
        }
        const arr1 = dst.array as Float32Array;
        const arr0 = src.array as ArrayLike<number>;
        for (let i = 0, len = arr0.length; i < len; i += 9) {
            for (let j = 0; j < 9; j += 3) {
                _v.fromArray(arr0, i + 6 - j);
                _v.reflect(flipDir);
                arr1[i + j] = _v.x;
                arr1[i + j + 1] = _v.y;
                arr1[i + j + 2] = _v.z;
            }
        }
        dst.needsUpdate = true;
    }
}
