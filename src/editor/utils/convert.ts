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
