import {BufferGeometry, Color, Float32BufferAttribute, LineBasicMaterial, LineSegments, Material} from 'three';

export default class GridsGeometry extends LineSegments {
    constructor(size = 10, divisions = 10, color1_ = 0x444444, color2_ = 0x444444, color3_ = 0x888888) {
        const color1 = new Color(color1_);
        const color2 = new Color(color2_);
        const color3 = new Color(color3_);
        const center = divisions / 2;
        const step = size / divisions;
        const halfSize = size / 2;
        const vertices: number[] = [];
        const colors: number[] = [];
        for (let i = 0, j = 0, k = -halfSize; i <= divisions; i++, k += step) {
            vertices.push(-halfSize, 0, k, halfSize, 0, k);
            vertices.push(k, 0, -halfSize, k, 0, halfSize);
            const colorX = i === center ? color1 : color3;
            const colorY = i === center ? color2 : color3;
            colorX.toArray(colors, j);
            j += 3;
            colorX.toArray(colors, j);
            j += 3;
            colorY.toArray(colors, j);
            j += 3;
            colorY.toArray(colors, j);
            j += 3;
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
        const material = new LineBasicMaterial({vertexColors: true, toneMapped: false});
        super(geometry, material);
        this.type = 'Grids';
    }

    dispose() {
        this.geometry.dispose();
        (this.material as Material).dispose();
    }
}
