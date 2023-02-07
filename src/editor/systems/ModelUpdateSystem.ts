import {
    BufferAttribute,
    BufferGeometry,
    Float32BufferAttribute,
    InterleavedBufferAttribute,
    Matrix4,
    Mesh,
    Object3D,
    Quaternion,
    Vector3
} from 'three';
import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import CFlipDirection from '../model/components/CFlipDirection';
import CObject3D, {Object3DUserData} from '../model/components/CObject3D';
import CUsePlainMaterial from '../model/components/CUsePlainMaterial';
import CVisible from '../model/components/CVisible';
import ModelNode from '../model/ModelNode';
import {getModelNodeDef} from '../model/ModelNodeDef';
import {hashFloat32x3} from '../utils/hash';
import {getAxisAngle} from '../utils/math';
import UpdateSystem from '../utils/UpdateSystem';

export interface ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void;
}

type InstanceObject3DUserData = Object3DUserData & {
    origin: Object3D,
    instanceId: number,
    relatedMatOrigin?: Matrix4,
    relatedMatFlipped?: Matrix4,
};

const _dirtyNodes: ModelNode[] = [];
const _v = new Vector3();
const _translation = new Vector3();
const _rotation = new Quaternion();
const _parentMat0 = new Matrix4();
const _invParentMat1 = new Matrix4();
const _axis = new Vector3();

export default class ModelUpdateSystem extends UpdateSystem<EditorContext> {

    private readonly filters: ModelNodeUpdateFilter[];

    constructor(filters: ModelNodeUpdateFilter[]) {
        super();
        this.filters = filters;
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        const rawThis = toRaw(this);
        if (ctx.model.dirty) {
            // list dirty nodes
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
            // run filters
            for (let filter of rawThis.filters) {
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
        // update shadow node meshes
        if (ctx.model.instanceDirty) {
            ctx.model.instanceDirty = false;
            ctx.model.forEach(node => {
                if (node.instanceId) {
                    if (node.instanceMeshDirty) {
                        node.instanceMeshDirty = false;
                        const def = getModelNodeDef(node.type);
                        if (!def.mesh) {
                            return;
                        }
                        let rebuild = node.instanceMeshRebuild;
                        if (node.instanceMeshRebuild) {
                            node.instanceMeshRebuild = false;
                            rawThis.recreateInstanceMesh(ctx, node);
                        }
                        if (node.has(CFlipDirection)) {
                            // update mirror node geometries
                            ctx.throttle(
                                `#${node.id}-update-instance-mirror-geometry`,
                                250,
                                () => {
                                    if (node.deleted) {
                                        return;
                                    }
                                    rawThis.updateInstanceMirrorGeometry(ctx, node);
                                },
                                node.visible && rebuild
                            );
                        }
                    }
                    rawThis.updateInstanceMaterial(ctx, node);
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
        cObject3D.instance = true;
        cObject3D.dispose();
        if (!ctx.model.isNodeExists(node.instanceId)) {
            return;
        }
        const target = ctx.model.getNode(node.instanceId);
        const obj = target.value(CObject3D);
        if (!obj) {
            return;
        }
        const stack: [Object3D, Object3D | null][] = [[obj, null]];
        let idCount = 0;
        while (stack.length) {
            const pair = stack.pop();
            if (!pair) {
                break;
            }
            const obj = pair[0];
            const parent = pair[1];
            let newObj: Object3D;
            if ((obj as Mesh).isMesh) {
                const mesh = obj as Mesh;
                newObj = new Mesh(mesh.geometry, mesh.material);
            } else {
                newObj = new Object3D();
            }
            newObj.position.copy(obj.position);
            newObj.quaternion.copy(obj.quaternion);
            newObj.scale.copy(obj.scale);
            newObj.updateMatrix();
            newObj.updateMatrixWorld(true);
            (newObj.userData as InstanceObject3DUserData) = {
                node,
                origin: obj,
                instanceId: idCount++,
            };
            if (parent) {
                parent.add(newObj);
            } else {
                cObject3D.value = newObj;
            }
            for (let child of obj.children) {
                stack.push([child, newObj]);
            }
        }
        node.dirty = true;
        cObject3D.parentChanged = true;
        cObject3D.localTransformChanged = true;
        cObject3D.worldTransformChanged = true;
        cObject3D.usePlainMaterial = target.get(CObject3D).usePlainMaterial;
    }

    private updateInstanceMaterial(ctx: EditorContext, node: ModelNode) {
        if (!node.has(CObject3D)) {
            return;
        }
        if (!node.has(CUsePlainMaterial)) {
            return;
        }
        const target = ctx.model.getNode(node.instanceId);
        const cObject3D = node.get(CObject3D);
        const cTargetObject3D = target.get(CObject3D);
        if (cObject3D.usePlainMaterial === cTargetObject3D.usePlainMaterial) {
            return;
        }
        cObject3D.usePlainMaterial = cTargetObject3D.usePlainMaterial;
        if (!cObject3D.value) {
            return;
        }
        if (!cTargetObject3D.value) {
            return;
        }
        const stack: [Object3D, Object3D][] = [[cObject3D.value, cTargetObject3D.value]];
        while (stack.length) {
            const pair = stack.pop();
            if (!pair) {
                break;
            }
            const obj = pair[0] as Mesh;
            const target = pair[1] as Mesh;
            if (obj.isMesh) {
                obj.material = target.material;
            }
            if (obj.children.length === target.children.length) {
                for (let i = 0, len = obj.children.length; i < len; ++i) {
                    stack.push([obj.children[i], target.children[i]]);
                }
            }
        }
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
        const targetNode = ctx.model.getNode(node.instanceId);
        const target = targetNode.value(CObject3D);
        if (!target) {
            return;
        }
        const ACCURACY = 1e-6;
        const cacheHash = hashFloat32x3(
            Math.round(flipDir.x / ACCURACY) * ACCURACY,
            Math.round(flipDir.y / ACCURACY) * ACCURACY,
            Math.round(flipDir.z / ACCURACY) * ACCURACY,
        );
        const base = obj;
        const stack: Object3D[] = [base];
        while (stack.length) {
            const obj = stack.shift();
            if (!obj) {
                break;
            }
            const userData = obj.userData as InstanceObject3DUserData;
            if (!userData.relatedMatOrigin) {
                userData.relatedMatOrigin = new Matrix4();
                userData.relatedMatFlipped = new Matrix4();
            }
            if (obj !== base) {
                const parent = (obj.parent!.userData as InstanceObject3DUserData);
                _parentMat0.copy(parent.relatedMatOrigin!);
                _invParentMat1.copy(parent.relatedMatFlipped!).invert();
                const origin = userData.origin;
                _translation.copy(origin.position);
                _translation.applyMatrix4(_parentMat0).reflect(flipDir).applyMatrix4(_invParentMat1);
                _rotation.copy(origin.quaternion);
                const angle = getAxisAngle(_axis, _rotation);
                _axis.applyMatrix4(_parentMat0).reflect(flipDir).applyMatrix4(_invParentMat1);
                _axis.normalize();
                _rotation.setFromAxisAngle(_axis, -angle);
                obj.position.copy(_translation);
                obj.quaternion.copy(_rotation);
                obj.updateMatrix();
                obj.updateMatrixWorld(true);
                userData.relatedMatOrigin.multiplyMatrices(_parentMat0, origin.matrix);
                userData.relatedMatFlipped!.multiplyMatrices(parent.relatedMatFlipped!, obj.matrix);
            }
            if ((obj as Mesh).isMesh) {
                this.mirrorMesh(
                    targetNode,
                    cacheHash + '/' + userData.instanceId,
                    obj as Mesh,
                    userData.origin as Mesh,
                    flipDir
                );
            }
            stack.push(...obj.children);
        }
    }

    private mirrorMesh(targetNode: ModelNode, hash: string, dst: Mesh, src: Mesh, flipDir: Vector3) {
        if (!dst?.geometry || !src?.geometry) {
            return;
        }
        if (targetNode.mirrorGeometry[hash]) {
            // cache matched
            dst.geometry = targetNode.mirrorGeometry[hash];
            return;
        }
        if (dst.geometry === src.geometry) {
            dst.geometry = new BufferGeometry();
            const index = src.geometry.getIndex();
            if (index) {
                dst.geometry.index = new BufferAttribute(
                    new Uint32Array(index.array.length),
                    index.itemSize
                );
                this.flipIndex(dst.geometry.index, index);
            }
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
            const aColor = src.geometry.getAttribute('color');
            if (aColor) {
                dst.geometry.setAttribute('color', new Float32BufferAttribute(
                    new Float32Array(aColor.array as ArrayLike<number>),
                    aColor.itemSize
                ));
            }
            const aUv = src.geometry.getAttribute('uv');
            if (aUv) {
                dst.geometry.setAttribute('uv', aUv.clone());
            }
        }
        this.mirrorGeometry(dst.geometry, src.geometry, flipDir);
        dst.geometry.boundingSphere = null;
        // cache
        targetNode.mirrorGeometry[hash] = dst.geometry;
    }

    private flipIndex(dst: BufferAttribute, src: BufferAttribute) {
        const arr1 = dst.array as Uint32Array;
        const arr0 = src.array;
        for (let i = 0, len = arr0.length; i < len; i += 3) {
            arr1[i] = arr0[i + 2];
            arr1[i + 1] = arr0[i + 1];
            arr1[i + 2] = arr0[i];
        }
    }

    private mirrorGeometry(dst: BufferGeometry, src: BufferGeometry, flipDir: Vector3) {
        const flipTriangle = !dst.getIndex();
        this.mirrorAttribute(dst.getAttribute('position'), src.getAttribute('position'), flipDir, flipTriangle);
        this.mirrorAttribute(dst.getAttribute('normal'), src.getAttribute('normal'), flipDir, flipTriangle);
        if (flipTriangle) {
            this.flipTriangles(dst.getAttribute('color'), src.getAttribute('color'));
        }
    }

    private mirrorAttribute(dst: BufferAttribute | InterleavedBufferAttribute,
                            src: BufferAttribute | InterleavedBufferAttribute,
                            flipDir: Vector3,
                            flipTriangle: boolean
    ) {
        if (!dst || !src) {
            return;
        }
        if (dst.itemSize !== 3) {
            return;
        }
        const arr1 = dst.array as Float32Array;
        const arr0 = src.array as ArrayLike<number>;
        if (flipTriangle) {
            for (let i = 0, len = arr0.length; i < len; i += 9) {
                for (let j = 0; j < 9; j += 3) {
                    _v.fromArray(arr0, i + 6 - j);
                    _v.reflect(flipDir);
                    arr1[i + j] = _v.x;
                    arr1[i + j + 1] = _v.y;
                    arr1[i + j + 2] = _v.z;
                }
            }
        } else {
            for (let i = 0, len = arr0.length; i < len; i += 3) {
                _v.fromArray(arr0, i);
                _v.reflect(flipDir);
                arr1[i] = _v.x;
                arr1[i + 1] = _v.y;
                arr1[i + 2] = _v.z;
            }
        }
        dst.needsUpdate = true;
    }

    private flipTriangles(dst: BufferAttribute | InterleavedBufferAttribute,
                          src: BufferAttribute | InterleavedBufferAttribute
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
                arr1[i + j] = arr0[i + 6 - j];
                arr1[i + j + 1] = arr0[i + 6 - j + 1];
                arr1[i + j + 2] = arr0[i + 6 - j + 2];
            }
        }
        dst.needsUpdate = true;
    }
}
