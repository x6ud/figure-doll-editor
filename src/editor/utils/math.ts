import {Matrix4, Quaternion, Vector2, Vector3} from 'three';

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

export function getScaleScalar(matrix: Matrix4) {
    matrix.decompose(_decomposeTranslation, _decomposeRotation, _decomposeScale);
    return _decomposeScale.x;
}

// https://github.com/x6ud/closest-points-between-two-lines
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

export const quatFromForwardUp = (function () {
    const _a = new Vector3();
    const _b = new Vector3();
    const _mat = new Matrix4();
    return function (out: Quaternion, forward: Vector3, up: Vector3) {
        _a.crossVectors(up, forward).normalize();
        _b.crossVectors(forward, _a).normalize();
        _mat.set(
            _a.x, _a.y, _a.z, 0,
            _b.x, _b.y, _b.z, 0,
            forward.x, forward.y, forward.z, 0,
            0, 0, 0, 1
        ).transpose();
        return out.setFromRotationMatrix(_mat);
    };
})();

export function snapPoint(p: Vector3, snap: number) {
    p.x = Math.round(p.x / snap) * snap;
    p.y = Math.round(p.y / snap) * snap;
    p.z = Math.round(p.z / snap) * snap;
    return p;
}

export function vectorsEqual(a: Vector3, b: Vector3) {
    return Math.abs(a.x - b.x) < 1e-8
        && Math.abs(a.y - b.y) < 1e-8
        && Math.abs(a.z - b.z) < 1e-8;
}

export function intersectPointRect(point: Vector2 | Vector3, rectStart: Vector2, rectEnd: Vector2) {
    const x0 = Math.min(rectStart.x, rectEnd.x),
        x1 = Math.max(rectStart.x, rectEnd.x),
        y0 = Math.min(rectStart.y, rectEnd.y),
        y1 = Math.max(rectStart.y, rectEnd.y),
        x = point.x,
        y = point.y;
    return !(x < x0 || x > x1 || y < y0 || y > y1);
}

// https://github.com/embree/embree/blob/master/tutorials/common/math/closest_point.h
export const closestPointToTriangle = (function () {
    const ap = new Vector3();
    const bp = new Vector3();
    const cp = new Vector3();
    return function (
        out: Vector3,
        p: Vector3,
        a: Vector3, b: Vector3, c: Vector3,
        ab: Vector3, ac: Vector3, bc: Vector3
    ): Vector3 {
        ap.subVectors(p, a);
        const d1 = ab.dot(ap);
        const d2 = ac.dot(ap);
        if (d1 <= 0 && d2 <= 0) {
            return out.copy(a);
        }
        bp.subVectors(p, b);
        const d3 = ab.dot(bp);
        const d4 = ac.dot(bp);
        if (d3 >= 0 && d4 <= d3) {
            return out.copy(b);
        }
        cp.subVectors(p, c);
        const d5 = ab.dot(cp);
        const d6 = ac.dot(cp);
        if (d6 >= 0 && d5 <= d6) {
            return out.copy(c);
        }
        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return out.copy(a).addScaledVector(ab, v);
        }
        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const v = d2 / (d2 - d6);
            return out.copy(a).addScaledVector(ac, v);
        }
        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const v = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            return out.copy(b).addScaledVector(bc, v);
        }
        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;
        return out.copy(a).addScaledVector(ab, v).addScaledVector(ac, w);
    };
})();

export const rayTriangleIntersect = (function () {
    const diff = new Vector3();
    const n = new Vector3();
    const cross1 = new Vector3();
    const cross2 = new Vector3();
    return function (o: Vector3, dir: Vector3, a: Vector3, ab: Vector3, ac: Vector3) {
        n.crossVectors(ab, ac);
        let dirDotN = dir.dot(n);
        let sign;
        if (dirDotN > 0) {
            sign = 1;
        } else if (dirDotN < 0) {
            sign = -1;
            dirDotN = -dirDotN;
        } else {
            return -1;
        }
        diff.subVectors(o, a);
        const dirDotQxE2 = sign * dir.dot(cross2.crossVectors(diff, ac));
        if (dirDotQxE2 < 0) {
            return -1;
        }
        const dirDotE1xQ = sign * dir.dot(cross1.crossVectors(ab, diff));
        if (dirDotE1xQ < 0) {
            return -1;
        }
        if (dirDotE1xQ + dirDotQxE2 > dirDotN) {
            return -1;
        }
        const qDotN = -sign * diff.dot(n);
        if (qDotN < 0) {
            return -1;
        }
        return qDotN / dirDotN;
    };
})();

export const closestPointOnLine = (function () {
    const det = new Vector3();
    return function (out: Vector3, o: Vector3, dir: Vector3, p: Vector3) {
        return out.copy(o).addScaledVector(dir, det.subVectors(p, o).dot(dir));
    };
})();

export const angleBetween2VectorsInPanel = (function () {
    const cross = new Vector3();
    return function (panelNormal: Vector3, a: Vector3, b: Vector3) {
        return Math.atan2(cross.crossVectors(a, b).dot(panelNormal), a.dot(b));
    };
})();
