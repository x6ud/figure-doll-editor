import {
    Frustum,
    InstancedMesh,
    Line,
    Matrix4,
    Mesh,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    Points,
    Quaternion,
    Vector3
} from 'three';

const _frustum = new Frustum();
const _center = new Vector3();
const _tmpPoint = new Vector3();
const _vecNear = new Vector3();
const _vecTopLeft = new Vector3();
const _vecTopRight = new Vector3();
const _vecDownRight = new Vector3();
const _vecDownLeft = new Vector3();
const _vecFarTopLeft = new Vector3();
const _vecFarTopRight = new Vector3();
const _vecFarDownRight = new Vector3();
const _vecFarDownLeft = new Vector3();
const _vectemp1 = new Vector3();
const _vectemp2 = new Vector3();
const _vectemp3 = new Vector3();
const _matrix = new Matrix4();
const _quaternion = new Quaternion();
const _scale = new Vector3();

export default class SelectionRect {
    private readonly dom: HTMLElement;
    private parent?: HTMLElement;
    x0 = 0;
    y0 = 0;
    x1 = 0;
    y1 = 0;

    constructor() {
        const dom = this.dom = document.createElement('div');
        dom.style.pointerEvents = 'none';
        dom.style.position = 'absolute';
        dom.style.zIndex = '20';
        dom.style.border = 'dashed 1px #fff';
        dom.style.background = 'rgba(255, 255, 255, .1)';
        dom.style.boxSizing = 'border-box';
    }

    attach(parent: HTMLElement) {
        this.parent = parent;
        parent.appendChild(this.dom);
    }

    detach() {
        this.parent = undefined;
        this.dom.remove();
    }

    show() {
        this.dom.style.display = 'block';
    }

    hide() {
        this.dom.style.display = 'none';
    }

    setPoint1(ndcX: number, ndcY: number) {
        this.x0 = ndcX;
        this.y0 = ndcY;
    }

    setPoint2(ndcX: number, ndcY: number) {
        this.x1 = ndcX;
        this.y1 = ndcY;
        if (!this.parent) {
            return;
        }
        const x0 = (this.x0 + 1) / 2;
        const x1 = (this.x1 + 1) / 2;
        const y0 = (this.y0 + 1) / 2;
        const y1 = (this.y1 + 1) / 2;
        const rect = this.parent.getBoundingClientRect();
        const l = Math.round(rect.width * Math.max(Math.min(x0, x1), 0));
        const r = Math.round(rect.width * Math.min((1 - Math.max(x0, x1)), 1));
        const t = Math.round(rect.height * Math.max((1 - Math.max(y0, y1)), 0));
        const b = Math.round(rect.height * Math.min(y0, y1, 1));
        this.dom.style.left = `${l}px`;
        this.dom.style.right = `${r}px`;
        this.dom.style.top = `${t}px`;
        this.dom.style.bottom = `${b}px`;
        if (x0 !== x1 || y0 !== y1) {
            this.show();
        } else {
            this.hide();
        }
    }

    select(camera: PerspectiveCamera | OrthographicCamera, objects: Object3D[]) {
        // modified from three/examples/js/interactive/SelectionBox.js

        // update frustum
        let x0 = this.x0, y0 = this.y0, x1 = this.x1, y1 = this.y1;
        if (x0 === x1) {
            x1 += Number.EPSILON;
        }
        if (y0 === y1) {
            y1 += Number.EPSILON;
        }
        const z0 = 0, z1 = 1;
        const deep = Number.MAX_VALUE;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        if ((camera as PerspectiveCamera).isPerspectiveCamera) {
            _tmpPoint.set(x0, y0, z0);
            _tmpPoint.x = Math.min(x0, x1);
            _tmpPoint.y = Math.max(y0, y1);
            x1 = Math.max(x0, x1);
            y1 = Math.min(y0, y1);
            _vecNear.setFromMatrixPosition(camera.matrixWorld);
            _vecTopLeft.copy(_tmpPoint);
            _vecTopRight.set(x1, _tmpPoint.y, 0);
            _vecDownRight.set(x1, y1, z1);
            _vecDownLeft.set(_tmpPoint.x, y1, 0);
            _vecTopLeft.unproject(camera);
            _vecTopRight.unproject(camera);
            _vecDownRight.unproject(camera);
            _vecDownLeft.unproject(camera);
            _vectemp1.copy(_vecTopLeft).sub(_vecNear);
            _vectemp2.copy(_vecTopRight).sub(_vecNear);
            _vectemp3.copy(_vecDownRight).sub(_vecNear);
            _vectemp1.normalize();
            _vectemp2.normalize();
            _vectemp3.normalize();
            _vectemp1.multiplyScalar(deep);
            _vectemp2.multiplyScalar(deep);
            _vectemp3.multiplyScalar(deep);
            _vectemp1.add(_vecNear);
            _vectemp2.add(_vecNear);
            _vectemp3.add(_vecNear);
            const planes = _frustum.planes;
            planes[0].setFromCoplanarPoints(_vecNear, _vecTopLeft, _vecTopRight);
            planes[1].setFromCoplanarPoints(_vecNear, _vecTopRight, _vecDownRight);
            planes[2].setFromCoplanarPoints(_vecDownRight, _vecDownLeft, _vecNear);
            planes[3].setFromCoplanarPoints(_vecDownLeft, _vecTopLeft, _vecNear);
            planes[4].setFromCoplanarPoints(_vecTopRight, _vecDownRight, _vecDownLeft);
            planes[5].setFromCoplanarPoints(_vectemp3, _vectemp2, _vectemp1);
            planes[5].normal.multiplyScalar(-1);
        } else if ((camera as OrthographicCamera).isOrthographicCamera) {
            const left = Math.min(x0, x1);
            const top = Math.max(y0, y1);
            const right = Math.max(x0, x1);
            const down = Math.min(y0, y1);
            _vecTopLeft.set(left, top, -1);
            _vecTopRight.set(right, top, -1);
            _vecDownRight.set(right, down, -1);
            _vecDownLeft.set(left, down, -1);
            _vecFarTopLeft.set(left, top, 1);
            _vecFarTopRight.set(right, top, 1);
            _vecFarDownRight.set(right, down, 1);
            _vecFarDownLeft.set(left, down, 1);
            _vecTopLeft.unproject(camera);
            _vecTopRight.unproject(camera);
            _vecDownRight.unproject(camera);
            _vecDownLeft.unproject(camera);
            _vecFarTopLeft.unproject(camera);
            _vecFarTopRight.unproject(camera);
            _vecFarDownRight.unproject(camera);
            _vecFarDownLeft.unproject(camera);
            const planes = _frustum.planes;
            planes[0].setFromCoplanarPoints(_vecTopLeft, _vecFarTopLeft, _vecFarTopRight);
            planes[1].setFromCoplanarPoints(_vecTopRight, _vecFarTopRight, _vecFarDownRight);
            planes[2].setFromCoplanarPoints(_vecFarDownRight, _vecFarDownLeft, _vecDownLeft);
            planes[3].setFromCoplanarPoints(_vecFarDownLeft, _vecFarTopLeft, _vecTopLeft);
            planes[4].setFromCoplanarPoints(_vecTopRight, _vecDownRight, _vecDownLeft);
            planes[5].setFromCoplanarPoints(_vecFarDownRight, _vecFarTopRight, _vecFarTopLeft);
            planes[5].normal.multiplyScalar(-1);
        }
        // search
        const collection: Object3D[] = [];
        const instances: { [uuid: string]: number[] } = {};
        for (let object of objects) {
            this.searchChildInFrustum(collection, instances, _frustum, object);
        }
        return collection;
    }

    private searchChildInFrustum(
        collection: Object3D[],
        instances: { [uuid: string]: number[] },
        frustum: Frustum,
        object: Object3D
    ) {
        if ((object as Mesh).isMesh || (object as Line).isLine || (object as Points).isPoints) {
            if ((object as InstancedMesh).isInstancedMesh) {
                const mesh = object as InstancedMesh;
                instances[mesh.uuid] = [];
                for (let instanceId = 0; instanceId < mesh.count; instanceId++) {
                    mesh.getMatrixAt(instanceId, _matrix);
                    _matrix.decompose(_center, _quaternion, _scale);
                    _center.applyMatrix4(mesh.matrixWorld);
                    if (frustum.containsPoint(_center)) {
                        instances[mesh.uuid].push(instanceId);
                    }
                }
            } else {
                const mesh = object as (Mesh | Line | Points);
                if (mesh.geometry.boundingSphere === null) {
                    mesh.geometry.computeBoundingSphere();
                }
                _center.copy(mesh.geometry.boundingSphere!.center);
                _center.applyMatrix4(object.matrixWorld);
                if (frustum.containsPoint(_center)) {
                    collection.push(object);
                }
            }
        }
        if (object.children.length > 0) {
            for (let i = 0; i < object.children.length; i++) {
                this.searchChildInFrustum(collection, instances, frustum, object.children[i]);
            }
        }
    }
}
