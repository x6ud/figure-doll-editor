import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    label: 'Scale',
})
export default class CScale extends ModelNodeComponent<number> {
    value = 1.0;
}
