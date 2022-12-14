import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({})
export default class CSdfDirty extends ModelNodeComponent<boolean> {
    value: boolean = true;
    throttleHash: string = '';
}
