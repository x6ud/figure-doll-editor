export function sphere(
    x: number, y: number, z: number,
    cx: number, cy: number, cz: number,
    radius: number
) {
    return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) - radius;
}

export function roundCone(
    px: number, py: number, pz: number,
    ax: number, ay: number, az: number, r1: number,
    bx: number, by: number, bz: number, r2: number,
) {
    const baX = bx - ax;
    const baY = by - ay;
    const baZ = bz - az;
    const l2 = baX ** 2 + baY ** 2 + baZ ** 2;
    const rr = r1 - r2;
    const a2 = l2 - rr ** 2;
    const il2 = 1.0 / l2;

    const paX = px - ax;
    const paY = py - ay;
    const paZ = pz - az;
    const y = paX * baX + paY * baY + paZ * baZ;
    const z = y - l2;
    const x2 = (paX * l2 - baX * y) ** 2 + (paY * l2 - baY * y) ** 2 + (paZ * l2 - baZ * y) ** 2;
    const y2 = y ** 2 * l2;
    const z2 = z ** 2 * l2;

    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(z) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(y) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

export function merge(shape1: number, shape2: number) {
    return Math.min(shape1, shape2);
}

export function mergeSmooth(d1: number, d2: number, k: number) {
    const h = Math.max(0.0, Math.min(1.0, 0.5 + 0.5 * (d2 - d1) / k));
    return d2 * (1 - h) + d1 * h - k * h * (1.0 - h);
}

export function intersect(shape1: number, shape2: number) {
    return Math.max(shape1, shape2);
}

export function intersectSmooth(d1: number, d2: number, k: number) {
    const h = Math.max(0.0, Math.min(1.0, 0.5 - 0.5 * (d2 - d1) / k));
    return d2 * (1 - h) + d1 * h + k * h * (1.0 - h);
}

export function subtract(shape1: number, shape2: number) {
    return intersect(shape1, -shape2);
}

export function subtractSmooth(d1: number, d2: number, k: number) {
    return intersectSmooth(d1, -d2, k);
}
