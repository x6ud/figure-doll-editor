import {Euler, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3} from 'three';

const _euler = new Euler();
const _cross = new Vector3();
const _dir = new Vector3();
const _rotation = new Quaternion();

export default class ArcRotateCamera {
    perspective: boolean = true;
    perspectiveCamera = new PerspectiveCamera(45, 1, 0.1, 2000);
    orthographicCamera = new OrthographicCamera(-1, 1, -1, 1, 0, 2000);
    target = new Vector3();
    distance: number = 1;
    alpha: number = 0;
    beta: number = 0;
    _position = new Vector3();
    _up = new Vector3();

    get(): PerspectiveCamera | OrthographicCamera {
        return this.perspective ? this.perspectiveCamera : this.orthographicCamera;
    }

    update(width: number, height: number) {
        _euler.set(0, this.beta, -this.alpha);
        _rotation.setFromEuler(_euler);
        this._position.set(this.distance, 0, 0);
        this._position.applyQuaternion(_rotation);
        this._position.add(this.target);
        const camera = this.get();
        camera.position.copy(this._position);
        this._up.set(0, 1, 0);
        _dir.subVectors(this._position, this.target);
        if (_cross.crossVectors(this._up, _dir).lengthSq() < 1e-8) {
            this._up.applyQuaternion(_rotation);
        }
        camera.up.copy(this._up);
        camera.lookAt(this.target);
        if (this.perspective) {
            this.perspectiveCamera.aspect = width / height;
        } else {
            const scale = this.distance / 850.0;
            const halfWidth = width / 2 * scale;
            const halfHeight = height / 2 * scale;
            this.orthographicCamera.left = -halfWidth;
            this.orthographicCamera.right = +halfWidth;
            this.orthographicCamera.bottom = -halfHeight;
            this.orthographicCamera.top = +halfHeight;
        }
        camera.updateProjectionMatrix();
    }
}
