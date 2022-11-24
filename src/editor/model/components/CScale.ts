import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    equal(a: number, b: number) {
        return Math.abs(a - b) < 1e-8;
    },
    label: 'Scale',
})
export default class CScale extends ModelNodeComponent<number> {
    value = 1.0;
}
