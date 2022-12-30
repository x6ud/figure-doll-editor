import {Quaternion, Vector3} from 'three';
import {quatFromForwardUp} from '../math';
import CcdJoint from './CcdJoint';

const _prevIterEnd = new Vector3();
const _vJoint = new Vector3();
const _vTarget = new Vector3();
const _detRot = new Quaternion();
const _forward = new Vector3();
const _up = new Vector3();
const _invQuat = new Quaternion();

export default class CcdChain {
    joints: CcdJoint[] = [];
    iterLimit = 20;
    precision = 1e-4;

    resize(len: number) {
        this.joints.length = len;
        for (let i = 0; i < len; ++i) {
            if (!this.joints[i]) {
                this.joints[i] = new CcdJoint();
            }
        }
    }

    resolve(target: Vector3) {
        const len = this.joints.length;
        if (!len) {
            return;
        }

        for (let i = 0; i < len; ++i) {
            const joint = this.joints[i];
            if (i > 0) {
                const prev = this.joints[i - 1];
                joint.rotation.multiplyQuaternions(prev.rotation, joint.localRotation);
                joint.start.copy(prev.end);
            } else {
                joint.rotation.copy(joint.localRotation);
                joint.start.set(0, 0, 0);
            }
            joint.end.set(joint.length, 0, 0).applyQuaternion(joint.rotation).add(joint.start);
        }

        const tail = this.joints[len - 1];
        _prevIterEnd.copy(tail.end);
        for (let iter = 0; iter < this.iterLimit; ++iter) {
            for (let i = len - 1; i >= 0; --i) {
                const joint = this.joints[i];
                _vJoint.subVectors(tail.end, joint.start).normalize();
                _vTarget.subVectors(target, joint.start).normalize();
                _detRot.setFromUnitVectors(_vJoint, _vTarget);
                _forward.set(0, 0, 1).applyQuaternion(joint.rotation).applyQuaternion(_detRot);
                _up.set(0, 1, 0).applyQuaternion(joint.rotation).applyQuaternion(_detRot);
                quatFromForwardUp(joint.localRotation, _forward, _up);
                if (i > 0) {
                    const prev = this.joints[i - 1];
                    _invQuat.copy(prev.rotation).invert();
                    joint.localRotation.multiplyQuaternions(_invQuat, joint.localRotation);
                }
                for (let j = i; j < len; ++j) {
                    const joint = this.joints[j];
                    if (j > 0) {
                        const prev = this.joints[j - 1];
                        joint.rotation.multiplyQuaternions(prev.rotation, joint.localRotation);
                        joint.start.copy(prev.end);
                    } else {
                        joint.rotation.copy(joint.localRotation);
                        joint.start.set(0, 0, 0);
                    }
                    joint.end.set(joint.length, 0, 0).applyQuaternion(joint.rotation).add(joint.start);
                }
            }
            if (tail.end.distanceToSquared(_prevIterEnd) <= this.precision
                || tail.end.distanceToSquared(target) <= this.precision
            ) {
                break;
            }
            _prevIterEnd.copy(tail.end);
        }
    }
}
