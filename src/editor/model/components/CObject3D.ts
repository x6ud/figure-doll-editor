import {BufferGeometry, InstancedMesh, Material, Object3D} from 'three';
import DynamicMesh from '../../utils/geometry/dynamic/DynamicMesh';
import ModelNode from '../ModelNode';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({})
export default class CObject3D extends ModelNodeComponent<Object3D | null> {
    value: Object3D | null = null;
    parentChanged: boolean = true;
    localTransformChanged: boolean = true;
    worldTransformChanged: boolean = true;
    mesh?: DynamicMesh;
    /** Object belongs to a shadow node */
    instance: boolean = false;

    onRemoved() {
        this.dispose();
    }

    dispose() {
        if (this.value) {
            if (!this.instance) {
                disposeObject3D(this.value);
            }
            this.value.removeFromParent();
            this.value = null;
        }
    }
}

export type Object3DUserData = {
    node?: ModelNode;
}

export function disposeObject3D(obj: Object3D) {
    for (let child of obj.children) {
        disposeObject3D(child);
    }
    if ((obj as InstancedMesh).isInstancedMesh) {
        return;
    }
    if ('geometry' in obj) {
        const geometry = obj.geometry as BufferGeometry;
        if (geometry) {
            geometry.dispose();
        }
    }
    if ('material' in obj) {
        const material = obj.material;
        if (material) {
            if (material instanceof Array) {
                material.forEach(disposeMaterial);
            } else {
                disposeMaterial(material as Material);
            }
        }
    }
}

function disposeMaterial(material: Material) {
    Object.keys(material).forEach(key => {
        const member = (material as any)[key];
        if (member && typeof member === 'object') {
            if (typeof member.dispose === 'function') {
                member.dispose();
            }
        }
    });
    material.dispose();
}
