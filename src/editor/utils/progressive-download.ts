export async function progressiveDownload(
    url: string,
    onProgress: (received: number, total: number) => void,
    cancelFlag?: { value: boolean } | null,
    size?: number
) {
    const res = await fetch(url);
    if (!res.body) {
        throw new Error('Failed to get response body');
    }
    const reader = res.body.getReader();
    if (!size) {
        size = Number.parseInt(res.headers.get('Content-Length') || '0');
    }
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
        const {done, value} = await reader.read();
        if (done || !value) {
            break;
        }
        chunks.push(value);
        received += value.length;
        onProgress(received, size);
        if (cancelFlag?.value) {
            await reader.cancel();
            reader.releaseLock();
            return null;
        }
    }
    const ret = new Uint8Array(received);
    let i = 0;
    for (let chunk of chunks) {
        ret.set(chunk, i);
        i += chunk.length;
    }
    return ret;
}
