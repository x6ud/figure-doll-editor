import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({storable: true})
export default class CName extends ModelNodeComponent<string> {
    value = '';
}
