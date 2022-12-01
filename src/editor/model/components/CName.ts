import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({storable: true, dataType: DataType.STRING})
export default class CName extends ModelNodeComponent<string> {
    value = '';
}
