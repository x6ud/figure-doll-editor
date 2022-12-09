export async function uint8ArrayToDataUrl(data: Uint8Array): Promise<string> {
    return new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(new Blob([data]));
    });
}

export async function dataUrlToUint8Array(str: string): Promise<Uint8Array> {
    const res = await fetch(str);
    return new Uint8Array(await res.arrayBuffer());
}
