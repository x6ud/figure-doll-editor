import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BYTES,
    clone(val: Float32Array) {
        return new Float32Array(val);
    },
    serialize(val: Float32Array) {
        return new Uint8Array(val.buffer);
    },
    deserialize(val: Uint8Array) {
        return new Float32Array(val.buffer);
    }
})
export default class CVertices extends ModelNodeComponent<Float32Array> {
    value = new Float32Array();
    dirty = true;
}
