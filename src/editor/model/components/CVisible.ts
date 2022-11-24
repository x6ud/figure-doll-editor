import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({storable: true})
export default class CVisible extends ModelNodeComponent<boolean> {
    value: boolean = true;
}
