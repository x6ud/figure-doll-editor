import {Quaternion, Vector3} from 'three';
import {clampAngle, getAxisAngle, quatFromForwardUp} from '../math';
import CcdJoint from './CcdJoint';

const _prevIterEnd = new Vector3();
const _vJoint = new Vector3();
const _vTarget = new Vector3();
const _detRot = new Quaternion();
const _forward = new Vector3();
const _up = new Vector3();
const _invQuat = new Quaternion();
const _hingeAxis = new Vector3();

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

        // calculate joint start/end initial positions
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

        // ccd
        const tail = this.joints[len - 1];
        _prevIterEnd.copy(tail.end);
        for (let iter = 0; iter < this.iterLimit; ++iter) {
            for (let i = len - 1; i >= 0; --i) {
                const joint = this.joints[i];

                // rotate the joint to bring the tail closer to the target
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

                // hinge
                if (joint.hingeEnabled) {
                    _invQuat.copy(joint.localRotation).invert();
                    _hingeAxis.copy(joint.hingeAxis).applyQuaternion(_invQuat);
                    _detRot.setFromUnitVectors(joint.hingeAxis, _hingeAxis);
                    joint.localRotation.multiply(_detRot).normalize();
                    let angle = getAxisAngle(_hingeAxis, joint.localRotation);
                    const sign = Math.sign(_hingeAxis.dot(joint.hingeAxis));
                    angle = clampAngle(angle * sign, joint.lowerAngle, joint.upperAngle);
                    joint.localRotation.setFromAxisAngle(joint.hingeAxis, angle);
                }

                // update remaining joints
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

            // meet precision
            if (tail.end.distanceToSquared(_prevIterEnd) <= this.precision
                || tail.end.distanceToSquared(target) <= this.precision
            ) {
                break;
            }
            _prevIterEnd.copy(tail.end);
        }
    }
}
