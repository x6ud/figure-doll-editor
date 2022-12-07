import {Line, LineBasicMaterial, Matrix4, Object3D, Vector3} from 'three';
import {vectorsEqual} from '../../utils/math';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

export type TubeNode = {
    radius: number;
    position: Vector3;
}

export type Tube = TubeNode[];

function cloneTube(val: Tube): Tube {
    return val.map(node => ({radius: node.radius, position: new Vector3().copy(node.position)}));
}

export type TubeNodePickerUserData = {
    index?: number;
};

const normalMaterial = new LineBasicMaterial({
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    transparent: true,
    color: 0xffffff
});
const hoveredMaterial = normalMaterial.clone();
hoveredMaterial.color.setHex(0xffff00);
const selectedMaterial = normalMaterial.clone();
selectedMaterial.color.setHex(0xf3982d);

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    equal(a: Tube, b: Tube) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0, len = a.length; i < len; ++i) {
            const na = a[i];
            const nb = b[i];
            if (Math.abs(na.radius - nb.radius) > 1e-8 || !vectorsEqual(na.position, nb.position)) {
                return false;
            }
        }
        return true;
    },
    clone: cloneTube,
    serialize(val: Tube): number[] {
        const ret: number[] = [];
        for (let node of val) {
            ret.push(node.radius, node.position.x, node.position.y, node.position.z);
        }
        return ret;
    },
    deserialize(val: number[]): Tube {
        const ret: Tube = [];
        for (let i = 0, len = val.length; i < len; i += 4) {
            ret.push({
                radius: val[i],
                position: new Vector3(val[i + 1], val[i + 2], val[i + 3])
            });
        }
        return ret;
    }
})
export default class CTube extends ModelNodeComponent<Tube> {
    static readonly normalMaterial = normalMaterial;
    static readonly hoveredMaterial = hoveredMaterial;
    static readonly selectedMaterial = selectedMaterial;

    value: Tube = [];
    dirty = true;
    group?: Object3D;
    pickers: Object3D[] = [];
    circles: Object3D[] = [];
    lines: Object3D[] = [];
    hovered: number = -1;
    selected: number[] = [];
    draggingStartValue?: Tube;
    draggingStartMatrix?: Matrix4;
    draggingStartInvMatrix?: Matrix4;
    draggingStartNodeIndex: number = -1;

    onRemoved() {
        this.group?.removeFromParent();
    }

    updateColor() {
        for (let i = 0, len = this.circles.length; i < len; ++i) {
            const circle = this.circles[i] as Line;
            if (this.selected.includes(i) || i === this.draggingStartNodeIndex) {
                circle.material = selectedMaterial;
            } else if (i === this.hovered) {
                circle.material = hoveredMaterial;
            } else {
                circle.material = normalMaterial;
            }
            if (i < len - 1) {
                const line = this.lines[i] as Line;
                if (this.selected.includes(i) && this.selected.includes(i + 1)) {
                    line.material = selectedMaterial;
                } else {
                    line.material = normalMaterial;
                }
            }
        }
    }

    addSelection(index: number) {
        if (!this.selected.includes(index)) {
            this.selected.push(index);
        }
    }

    clone(val = this.value) {
        return cloneTube(val);
    }
}
