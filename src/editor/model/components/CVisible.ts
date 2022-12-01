import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({storable: true, dataType: DataType.BOOLEAN})
export default class CVisible extends ModelNodeComponent<boolean> {
    value: boolean = true;
}
