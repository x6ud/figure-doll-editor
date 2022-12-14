import {bytesToFloat32Array, float32ArrayToBytes} from '../../utils/convert';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

@registerModelComponent({
    storable: true,
    dataType: DataType.BYTES,
    clone(val: Float32Array) {
        return new Float32Array(val);
    },
    serialize: float32ArrayToBytes,
    deserialize: bytesToFloat32Array,
})
export default class CVertices extends ModelNodeComponent<Float32Array> {
    value = new Float32Array();
    dirty = true;
}
