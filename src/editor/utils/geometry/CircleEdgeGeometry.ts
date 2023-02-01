import {BufferGeometry} from 'three';
import {xyCirclePoints} from './helper';

export default class CircleEdgeGeometry extends BufferGeometry {

    constructor(radius: number = 1, seg: number = 20) {
        super();
        this.setFromPoints(xyCirclePoints(radius, seg));
        this.type = 'CircleEdgeGeometry';
    }

}
