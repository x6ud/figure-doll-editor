export async function bufferToDataUrl(data: BlobPart): Promise<string> {
    return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(new Blob([data]));
    });
}

export async function dataUrlToArrayBuffer(str: string): Promise<ArrayBuffer> {
    const res = await fetch(str);
    return res.arrayBuffer();
}

const _view = new DataView(new ArrayBuffer(4));

export function float32ArrayToBytes(arr: Float32Array) {
    const ret = new Uint8Array(arr.length * 4);
    for (let i = 0, len = arr.length; i < len; ++i) {
        _view.setFloat32(0, arr[i]);
        const j = i * 4;
        for (let k = 0; k < 4; ++k) {
            ret[j + k] = _view.getUint8(k);
        }
    }
    return ret;
}

export function bytesToFloat32Array(bytes: Uint8Array) {
    const ret = new Float32Array(bytes.length / 4);
    for (let i = 0, len = ret.length; i < len; ++i) {
        const j = i * 4;
        for (let k = 0; k < 4; ++k) {
            _view.setUint8(k, bytes[j + k]);
        }
        ret[i] = _view.getFloat32(0);
    }
    return ret;
}
