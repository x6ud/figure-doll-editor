import {Group, Mesh} from 'three';
import EditorContext from '../EditorContext';
import CObject3D, {Object3DUserData} from '../model/components/CObject3D';
import CVisible from '../model/components/CVisible';
import ModelNode from '../model/ModelNode';
import UpdateSystem from '../utils/UpdateSystem';

export interface ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void;
}

const dirtyNodes: ModelNode[] = [];

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
                    dirtyNodes.push(node);
                }
            });
            for (let filter of this.filters) {
                for (let node of dirtyNodes) {
                    filter.update(ctx, node);
                }
            }
            for (let node of dirtyNodes) {
                node.dirty = false;
            }
            dirtyNodes.length = 0;
            ctx.model.dirty = false;
        }
        if (ctx.model.instanceDirty) {
            ctx.model.instanceDirty = false;
            ctx.model.forEach(node => {
                if (node.instanceId && node.instanceDirty) {
                    node.instanceDirty = false;
                    this.updateInstance(ctx, node);
                }
            });
            ctx.model.dirty = true;
        }
    }

    end(ctx: EditorContext): void {
    }

    private updateInstance(ctx: EditorContext, node: ModelNode) {
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

}
