import {Material, Object3D} from 'three';
import {Geometry} from 'three/examples/jsm/deprecated/Geometry';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({})
export default class CObject3D extends ModelNodeComponent<Object3D | null> {
    value: Object3D | null = null;
    parentChanged: boolean = true;
    transformChanged: boolean = true;

    onRemoved() {
        if (this.value) {
            disposeObject3D(this.value);
            this.value.removeFromParent();
        }
    }

    dispose() {
        this.onRemoved();
    }
}

function disposeObject3D(obj: Object3D) {
    for (let child of obj.children) {
        disposeObject3D(child);
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
