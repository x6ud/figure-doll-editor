import {Matrix4, Quaternion, Vector3} from 'three';

export const linePanelIntersection = (function () {
    const _l = new Vector3();
    const _pr0 = new Vector3();
    return function (
        out: Vector3,
        ray0: Vector3,
        ray1: Vector3,
        p: Vector3,
        n: Vector3
    ): boolean {
        _l.subVectors(ray1, ray0);
        const rayLen = _l.length();
        if (rayLen < 1e-8) {
            return false;
        }
        _l.divideScalar(rayLen);
        const ln = _l.dot(n);
        if (Math.abs(ln) < 1e-8) {
            return false;
        }
        _pr0.subVectors(p, ray0);
        const t = _pr0.dot(n) / ln;
        out.copy(ray0);
        out.addScaledVector(_l, t);
        return true;
    };
})();

const _decomposeTranslation = new Vector3();
const _decomposeRotation = new Quaternion();
const _decomposeScale = new Vector3();

export function getTranslation(out: Vector3, matrix: Matrix4) {
    matrix.decompose(_decomposeTranslation, _decomposeRotation, _decomposeScale);
    out.copy(_decomposeTranslation);
    return out;
}

export function getRotation(out: Quaternion, matrix: Matrix4) {
    matrix.decompose(_decomposeTranslation, _decomposeRotation, _decomposeScale);
    out.copy(_decomposeRotation);
    return out;
}

export function getScale(out: Vector3, matrix: Matrix4) {
    matrix.decompose(_decomposeTranslation, _decomposeRotation, _decomposeScale);
    out.copy(_decomposeScale);
    return out;
}

export function closestPointsBetweenTwoLines(
    out1: Vector3 | null, out2: Vector3 | null,
    p1: Vector3, n1: Vector3, p2: Vector3, n2: Vector3
): boolean {
    let p1x = p1.x,
        p1y = p1.y,
        p1z = p1.z,
        n1x = n1.x,
        n1y = n1.y,
        n1z = n1.z,
        p2x = p2.x,
        p2y = p2.y,
        p2z = p2.z,
        n2x = n2.x,
        n2y = n2.y,
        n2z = n2.z;
    let d = n1x ** 2 * n2y ** 2
        + n1x ** 2 * n2z ** 2
        - 2 * n1x * n1y * n2x * n2y
        - 2 * n1x * n1z * n2x * n2z
        + n1y ** 2 * n2x ** 2
        + n1y ** 2 * n2z ** 2
        - 2 * n1y * n1z * n2y * n2z
        + n1z ** 2 * n2x ** 2
        + n1z ** 2 * n2y ** 2;
    let parallel = false;
    let t1 = (
        n1x * n2x * n2y * p1y
        - n1x * n2x * n2y * p2y
        + n1x * n2x * n2z * p1z
        - n1x * n2x * n2z * p2z
        - n1x * n2y ** 2 * p1x
        + n1x * n2y ** 2 * p2x
        - n1x * n2z ** 2 * p1x
        + n1x * n2z ** 2 * p2x
        - n1y * n2x ** 2 * p1y
        + n1y * n2x ** 2 * p2y
        + n1y * n2x * n2y * p1x
        - n1y * n2x * n2y * p2x
        + n1y * n2y * n2z * p1z
        - n1y * n2y * n2z * p2z
        - n1y * n2z ** 2 * p1y
        + n1y * n2z ** 2 * p2y
        - n1z * n2x ** 2 * p1z
        + n1z * n2x ** 2 * p2z
        + n1z * n2x * n2z * p1x
        - n1z * n2x * n2z * p2x
        - n1z * n2y ** 2 * p1z
        + n1z * n2y ** 2 * p2z
        + n1z * n2y * n2z * p1y
        - n1z * n2y * n2z * p2y) / d;
    if (!isFinite(t1)) {
        parallel = true;
        t1 = 0;
    }
    let o1x = p1x + n1x * t1;
    let o1y = p1y + n1y * t1;
    let o1z = p1z + n1z * t1;
    if (out1) {
        out1.x = o1x;
        out1.y = o1y;
        out1.z = o1z;
    }
    if (out2) {
        let t3 = (
            -n1x * n2y * p1z
            + n1x * n2y * p2z
            + n1x * n2z * p1y
            - n1x * n2z * p2y
            + n1y * n2x * p1z
            - n1y * n2x * p2z
            - n1y * n2z * p1x
            + n1y * n2z * p2x
            - n1z * n2x * p1y
            + n1z * n2x * p2y
            + n1z * n2y * p1x
            - n1z * n2y * p2x) / d;
        if (isFinite(t3)) {
            let n3x = n1y * n2z - n1z * n2y;
            let n3y = -n1x * n2z + n1z * n2x;
            let n3z = n1x * n2y - n1y * n2x;
            out2.x = o1x + n3x * t3;
            out2.y = o1y + n3y * t3;
            out2.z = o1z + n3z * t3;
        } else {
            parallel = true;
            let n3x = n1y * (p1z - p2z) - n1z * (p1y - p2y);
            let n3y = -n1x * (p1z - p2z) + n1z * (p1x - p2x);
            let n3z = n1x * (p1y - p2y) - n1y * (p1x - p2x);
            out2.x = o1x + n1y * n3z - n1z * n3y;
            out2.y = o1y + -n1x * n3z + n1z * n3x;
            out2.z = o1z + n1x * n3y - n1y * n3x;
        }
    }
    return parallel;
}
