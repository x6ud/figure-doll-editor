export function deepClone<T>(obj: T): T {
    if (typeof obj !== 'object' || !obj) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(deepClone) as T;
    }
    const ret = {} as { [key: string]: any };
    for (let key in obj) {
        if ((obj as { [key: string]: any }).hasOwnProperty(key)) {
            const val = obj[key];
            if (typeof val === 'object') {
                if (ArrayBuffer.isView(val)) {
                    ret[key] = val;
                } else if (Array.isArray(val)) {
                    ret[key] = val.map(deepClone);
                } else {
                    ret[key] = deepClone(val);
                }
            } else {
                ret[key] = val;
            }
        }
    }
    return ret as T;
}
