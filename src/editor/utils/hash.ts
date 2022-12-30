const _view = new DataView(new ArrayBuffer(12));
const _arr8: string[] = new Array(8);
const _arr12: string[] = new Array(8);

export function hashUint32x2(v1: number, v2: number) {
    _view.setUint32(0, v1);
    _view.setUint32(4, v2);
    for (let i = 0; i < 8; ++i) {
        _arr8[i] = String.fromCharCode(_view.getUint8(i));
    }
    return _arr8.join('');
}

export function hashFloat32x3(v1: number, v2: number, v3: number) {
    _view.setFloat32(0, v1 || +0);
    _view.setFloat32(4, v2 || +0);
    _view.setFloat32(8, v3 || +0);
    for (let i = 0; i < 12; ++i) {
        _arr12[i] = String.fromCharCode(_view.getUint8(i));
    }
    return _arr12.join('');
}
