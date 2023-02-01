import {Color} from 'three';
import InputColor from '../../components/input/InputColor/InputColor.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.NUMBER_ARRAY,
    autoCopy: true,
    equal: (a: [number, number, number], b: [number, number, number]) => {
        return new Color().setRGB(a[0], a[1], a[2]).getHex() === new Color().setRGB(b[0], b[1], b[2]).getHex();
    },
    label: 'Color',
    inlineLabel: true,
    inputComponent: InputColor,
    clone(val: [number, number, number]) {
        return [...val];
    }
})
export default class CColor extends ModelNodeComponent<[number, number, number]> {
    value: [number, number, number] = [1, 1, 1];
}
