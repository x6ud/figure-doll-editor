export const enum SerializationDataType {
    END,
    NUMBER,
    STRING,
    BYTES,
    OBJECT,
    NUMBER_ARR,
    STRING_ARR,
    OBJECT_ARR,
}

export default class ModelSerialization {
    private buffer: Uint8Array = new Uint8Array(64);
    private dataView: DataView = new DataView(this.buffer);
    private size: number = 0;

    private expandCapacity(size: number) {
        const required = size + this.size;
        if (this.buffer.length < required) {
            const newBuffer: Uint8Array = new Uint8Array(Math.pow(2, Math.ceil(Math.log2(required))));
            for (let i = 0, len = this.size; i < len; ++i) {
                newBuffer[i] = this.buffer[i];
            }
            this.buffer = newBuffer;
            this.dataView = new DataView(this.buffer);
        }
    }

    private writeType(type: SerializationDataType) {
        this.expandCapacity(1);
        this.buffer[this.size] = type;
        this.size += 1;
    }

    private writeUint32(val: number) {
        this.expandCapacity(4);
        this.dataView.setUint32(this.size, val);
        this.size += 4;
    }

    private writeFloat64(val: number) {
        this.expandCapacity(8);
        this.dataView.setFloat64(this.size, val);
        this.size += 8;
    }

    private writeString(str: string) {
        const encoder = new TextEncoder();
        const buf = encoder.encode(str);
        this.writeUint32(buf.length);
        this.expandCapacity(buf.length);
        for (let i = 0, len = buf.length; i < len; ++i) {
            this.buffer[this.size + i] = buf[i];
        }
        this.size += buf.length;
    }

    private writeBytes(bytes: Uint8Array) {
        this.writeUint32(bytes.length);
        this.expandCapacity(bytes.length);
        for (let i = 0, len = bytes.length; i < len; ++i) {
            this.buffer[this.size + i] = bytes[i];
        }
        this.size += bytes.length;
    }

    private writeDataNumber(val: number) {
        this.writeType(SerializationDataType.NUMBER);
        this.writeFloat64(val);
    }

    private writeDataString(val: string) {
        this.writeType(SerializationDataType.STRING);
        this.writeString(val);
    }

}
