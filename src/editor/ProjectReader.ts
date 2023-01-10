import CameraConfig from './model/CameraConfig';
import {DataType, getModelNodeComponentDef, isModelNodeComponentDefExists} from './model/ModelNodeComponentDef';
import {MAGIC_HEADER, SERIALIZATION_VERSION} from './ProjectWriter';

const _view = new DataView(new ArrayBuffer(8));

export type ProjectReaderResult = {
    views: {
        zoomLevel: number;
        alpha: number;
        beta: number;
        target: [number, number, number];
        perspective: boolean;
        fov: number;
    }[];
    cameras: CameraConfig[];
    nodes: {
        id: number;
        type: string;
        expanded: boolean;
        parentId: number;
        instanceId: number;
        data: { [name: string]: any };
    }[];
};

export default class ProjectReader {
    private buffer: Uint8Array;
    private index: number = 0;

    constructor(buffer: Uint8Array) {
        this.buffer = buffer;
    }

    private end(): boolean {
        return this.index >= this.buffer.length;
    }

    private readUint32(): number {
        for (let i = 0; i < 4; ++i) {
            _view.setUint8(i, this.buffer[this.index + i]);
        }
        const ret = _view.getUint32(0);
        this.index += 4;
        return ret;
    }

    private readFloat64(): number {
        for (let i = 0; i < 8; ++i) {
            _view.setUint8(i, this.buffer[this.index + i]);
        }
        const ret = _view.getFloat64(0);
        this.index += 8;
        return ret;
    }

    private readBoolean(): boolean {
        return !!this.readUint32();
    }

    private readString(): string {
        const decoder = new TextDecoder();
        const len = this.readUint32();
        const buf = this.buffer.subarray(this.index, this.index + len);
        const ret = decoder.decode(buf);
        this.index += len;
        return ret;
    }

    private readBytes(): Uint8Array {
        const len = this.readUint32();
        const ret = this.buffer.subarray(this.index, this.index + len);
        this.index += len;
        return ret;
    }

    private readNumberArray(): number[] {
        const len = this.readUint32();
        const ret: number[] = [];
        for (let i = 0; i < len; ++i) {
            ret.push(this.readFloat64());
        }
        return ret;
    }

    read() {
        const magicHeader = this.readUint32();
        if (magicHeader !== MAGIC_HEADER) {
            throw new Error(`Failed to read magic header`);
        }
        const version = this.readUint32();
        if (version > SERIALIZATION_VERSION) {
            throw new Error(`Unknown file version`);
        }
        const ret: ProjectReaderResult = {views: [], cameras: [], nodes: []};
        for (let i = 0; i < 4; ++i) {
            const zoomLevel = this.readFloat64();
            const alpha = this.readFloat64();
            const beta = this.readFloat64();
            const targetX = this.readFloat64();
            const targetY = this.readFloat64();
            const targetZ = this.readFloat64();
            let perspective = i === /* main */ 1;
            let fov = 45;
            if (version >= 2) {
                perspective = this.readBoolean();
                fov = this.readFloat64();
            }
            ret.views.push({zoomLevel, alpha, beta, target: [targetX, targetY, targetZ], perspective, fov});
        }
        if (version >= 2) {
            const len = this.readUint32();
            for (let i = 0; i < len; ++i) {
                const zoomLevel = this.readFloat64();
                const alpha = this.readFloat64();
                const beta = this.readFloat64();
                const targetX = this.readFloat64();
                const targetY = this.readFloat64();
                const targetZ = this.readFloat64();
                const perspective = this.readBoolean();
                const fov = this.readFloat64();
                ret.cameras.push({
                    zoomLevel,
                    alpha,
                    beta,
                    target: [targetX, targetY, targetZ],
                    perspective,
                    fov
                });
            }
        }
        while (!this.end()) {
            const id = this.readUint32();
            const type = this.readString();
            const expanded = this.readBoolean();
            const parentId = this.readUint32();
            const instanceId = this.readUint32();
            const dataLen = this.readUint32();
            const data: { [name: string]: any } = {};
            for (let i = 0; i < dataLen; ++i) {
                const dataType = this.readUint32() as DataType;
                const name = 'C' + this.readString();
                let value;
                switch (dataType) {
                    case DataType.NUMBER:
                        value = this.readFloat64();
                        break;
                    case DataType.STRING:
                        value = this.readString();
                        break;
                    case DataType.BOOLEAN:
                        value = this.readBoolean();
                        break;
                    case DataType.NUMBER_ARRAY:
                        value = this.readNumberArray();
                        break;
                    case DataType.BYTES:
                        value = this.readBytes();
                        break;
                    default:
                        throw new Error(`Unimplemented data type [${dataType}]`);
                }
                if (isModelNodeComponentDefExists(name)) {
                    const componentDef = getModelNodeComponentDef(name);
                    if (componentDef.deserialize) {
                        value = componentDef.deserialize(value);
                    }
                    data[name] = value;
                }
            }
            ret.nodes.push({id, type, expanded, parentId, instanceId, data});
        }
        return ret;
    }

}
