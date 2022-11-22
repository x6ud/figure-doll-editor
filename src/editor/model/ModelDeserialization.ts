import {SerializationDataType} from './ModelSerialization';

export default class ModelDeserialization {
    private buffer: Uint8Array;
    private dataView: DataView;
    private index: number = 0;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
    }

    private readType(): SerializationDataType {
        const ret = this.buffer[this.index];
        this.index += 1;
        return ret;
    }

    private readUint32(): number {
        const ret = this.dataView.getUint32(this.index);
        this.index += 4;
        return ret;
    }

    private readFloat64(): number {
        const ret = this.dataView.getFloat64(this.index);
        this.index += 8;
        return ret;
    }

    private readString(): string {
        const decoder = new TextDecoder();
        const len = this.readUint32();
        const buf = new Uint8Array(this.buffer, this.index, len);
        const ret = decoder.decode(buf);
        this.index += len;
        return ret;
    }

    private readBytes(): Uint8Array {
        const len = this.readUint32();
        const ret = new Uint8Array(this.buffer, this.index, len);
        this.index += len;
        return ret;
    }

    private readData(): any {
        const type = this.readType();
        switch (type) {
            case SerializationDataType.END:
                return;
            case SerializationDataType.NUMBER:
                return this.readFloat64();
            case SerializationDataType.STRING:
                return this.readString();
            default:
                throw new Error(`Unimplemented data type [${type}]`);
        }
    }

}
