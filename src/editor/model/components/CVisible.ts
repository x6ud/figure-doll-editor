import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BOOLEAN,
    instanceable: true,
})
export default class CVisible extends ModelNodeComponent<boolean> {
    value: boolean = true;
}
