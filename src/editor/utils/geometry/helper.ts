import {Vector3} from 'three';

export function xyCirclePoints(radius: number = 1, seg: number = 20) {
    const points: Vector3[] = [];
    let x0 = 0;
    let y0 = radius;
    const detAngle = Math.PI * 2 / seg;
    const cos = Math.cos(detAngle);
    const sin = Math.sin(detAngle);
    for (let i = 0; i < seg; ++i) {
        const x1 = x0 * cos - y0 * sin;
        const y1 = x0 * sin + y0 * cos;
        points.push(new Vector3(x0, y0, 0), new Vector3(x1, y1, 0));
        x0 = x1;
        y0 = y1;
    }
    return points;
}
