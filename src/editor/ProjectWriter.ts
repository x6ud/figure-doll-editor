import EditorContext from './EditorContext';
import {DataType, getModelNodeComponentDef} from './model/ModelNodeComponentDef';

export const MAGIC_HEADER = 0x78367564;
export const SERIALIZATION_VERSION = 2;

const _view = new DataView(new ArrayBuffer(8));

export default class ProjectWriter {
    private buffer: Uint8Array = new Uint8Array(64);
    private size: number = 0;

    private expandCapacity(size: number) {
        const required = size + this.size;
        if (this.buffer.length < required) {
            const newBuffer: Uint8Array = new Uint8Array(Math.pow(2, Math.ceil(Math.log2(required))));
            for (let i = 0, len = this.size; i < len; ++i) {
                newBuffer[i] = this.buffer[i];
            }
            this.buffer = newBuffer;
        }
    }

    private writeUint32(val: number) {
        this.expandCapacity(4);
        _view.setUint32(0, val);
        for (let i = 0; i < 4; ++i) {
            this.buffer[this.size + i] = _view.getUint8(i);
        }
        this.size += 4;
    }

    private writeFloat64(val: number) {
        this.expandCapacity(8);
        _view.setFloat64(0, val);
        for (let i = 0; i < 8; ++i) {
            this.buffer[this.size + i] = _view.getUint8(i);
        }
        this.size += 8;
    }

    private writeBoolean(val: boolean) {
        this.writeUint32(val ? 1 : 0);
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

    private writeNumberArray(arr: number[]) {
        this.writeUint32(arr.length);
        for (let val of arr) {
            this.writeFloat64(val);
        }
    }

    write(ctx: EditorContext) {
        ctx = ctx.readonlyRef();
        this.writeUint32(MAGIC_HEADER);
        this.writeUint32(SERIALIZATION_VERSION);
        for (let view of ctx.views) {
            this.writeFloat64(view.zoomLevel);
            this.writeFloat64(view.camera.alpha);
            this.writeFloat64(view.camera.beta);
            this.writeFloat64(view.camera.target.x);
            this.writeFloat64(view.camera.target.y);
            this.writeFloat64(view.camera.target.z);
            this.writeBoolean(view.index === ctx.mainViewIndex ? ctx.model.cameraPerspective : view.camera.perspective);
            this.writeFloat64(view.camera.perspectiveCamera.fov);
        }
        const model = ctx.model;
        this.writeUint32(model.cameras.length);
        for (let camera of model.cameras) {
            this.writeString(camera.name);
            this.writeFloat64(camera.zoomLevel);
            this.writeFloat64(camera.alpha);
            this.writeFloat64(camera.beta);
            this.writeFloat64(camera.target[0]);
            this.writeFloat64(camera.target[1]);
            this.writeFloat64(camera.target[2]);
            this.writeBoolean(camera.perspective);
            this.writeFloat64(camera.fov);
        }
        ctx.model.forEach(node => {
            this.writeUint32(node.id);
            this.writeString(node.type);
            this.writeBoolean(node.expanded);
            this.writeUint32(node.parent?.id || 0);
            this.writeUint32(node.instanceId);
            const data: [DataType, string, any][] = [];
            for (let name in node.components) {
                const component = node.components[name];
                const componentDef = getModelNodeComponentDef(name);
                if (componentDef.storable) {
                    if (node.instanceId && !componentDef.instanceable) {
                        continue;
                    }
                    const val = componentDef.serialize ? componentDef.serialize(component.value) : component.value;
                    if (val != null) {
                        data.push([componentDef.dataType!, name, val]);
                    }
                }
            }
            this.writeUint32(data.length);
            for (let item of data) {
                const dataType = item[0];
                const name = item[1];
                const val = item[2];
                this.writeUint32(dataType);
                this.writeString(name.substring(1));
                switch (dataType) {
                    case DataType.NUMBER:
                        this.writeFloat64(val);
                        break;
                    case DataType.STRING:
                        this.writeString(val);
                        break;
                    case DataType.BOOLEAN:
                        this.writeBoolean(val);
                        break;
                    case DataType.NUMBER_ARRAY:
                        this.writeNumberArray(val);
                        break;
                    case DataType.BYTES:
                        this.writeBytes(val);
                        break;
                    default:
                        throw new Error(`Unimplemented data type of component [${name}]`);
                }
            }
        });
        return this;
    }

    getBytes() {
        return this.buffer.subarray(0, this.size);
    }

}
