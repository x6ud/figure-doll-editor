import {InstancedMesh, Material, Object3D} from 'three';
import {Geometry} from 'three/examples/jsm/deprecated/Geometry';
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

    onRemoved() {
        this.dispose();
    }

    dispose() {
        if (this.value) {
            disposeObject3D(this.value);
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
        const geometry = obj.geometry as Geometry;
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
