import {Vector3} from 'three';

export const raycastPanel = (function () {
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
