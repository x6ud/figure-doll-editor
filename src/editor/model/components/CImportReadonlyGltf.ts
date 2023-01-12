import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BYTES,
})
export default class CImportReadonlyGltf extends ModelNodeComponent<Uint8Array> {
    value = new Uint8Array();
    dirty = true;
}
