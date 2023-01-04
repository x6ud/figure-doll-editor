import {Color} from 'three';
import InputColor from '../../components/input/InputColor/InputColor.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    equal: (a: [number, number, number], b: [number, number, number]) => {
        return new Color().setRGB(a[0], a[1], a[2]).getHex() === new Color().setRGB(b[0], b[1], b[2]).getHex();
    },
    label: 'Ground Color',
    inputComponent: InputColor,
    clone(val: [number, number, number]) {
        return [...val];
    }
})
export default class CGroundColor extends ModelNodeComponent<[number, number, number]> {
    value: [number, number, number] = [1, 1, 1];
}
