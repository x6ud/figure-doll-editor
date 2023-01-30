import {Quaternion, Vector3} from 'three';

export default class CcdJoint {
    length = 0;
    localRotation = new Quaternion();

    start = new Vector3();
    end = new Vector3();
    rotation = new Quaternion();

    hingeEnabled = false;
    hingeAxis = new Vector3(1, 0, 0);
    lowerAngle = -Math.PI;
    upperAngle = +Math.PI;
}
