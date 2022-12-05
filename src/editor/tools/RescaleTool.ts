import {Box3, BufferGeometry, Euler, Line, LineBasicMaterial, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CObject3D from '../model/components/CObject3D';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import CScale from '../model/components/CScale';
import ModelNode from '../model/ModelNode';
import {getTranslation, linePanelIntersection} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './Rescale.png';

const _mat = new Matrix4();
const _mouse = new Vector3();
const _det = new Vector3();
const _unitX = new Vector3(1, 0, 0);
const _mat1 = new Matrix4();
const _pos = new Vector3();
const _rot = new Quaternion();
const _scale = new Vector3();
const _box = new Box3();

export default class RescaleTool extends EditorTool {
    label = 'Rescale';
    icon = icon;

    private lineMaterial = new LineBasicMaterial({
        depthTest: false,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        transparent: true
    });
    private lineGeometry = new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(1, 0, 0)]);
    private line = new Line(this.lineGeometry, this.lineMaterial);

    /** Selected topmost nodes with scale component */
    private nodes: ModelNode[] = [];
    private dragging = false;
    private draggingViewIndex = -1;
    /** World matrix of the first node when dragging starts */
    private mat0 = new Matrix4();
    /** World position of the first node when dragging starts */
    private pos0 = new Vector3();
    /** The difference world matrices of other nodes relative to the first node */
    private detMat: Matrix4[] = [];
    /** The distance between the mouse and the origin of the first node when dragging starts */
    private len0 = 0;

    setup(ctx: EditorContext) {
        this.line.visible = false;
        ctx.scene.add(this.line);
    }

    begin(ctx: EditorContext): void {
        this.nodes = ctx.model.getTopmostSelectedNodes().filter(node => node.has(CScale));
        if (!this.nodes.length) {
            return;
        }
        this.line.visible = this.dragging;
    }

    update(ctx: EditorContext, view: EditorView): void {
        if (!this.nodes.length) {
            return;
        }
        const input = view.input;
        if (this.dragging && this.draggingViewIndex === view.index) {
            if (input.mouseLeft) {
                linePanelIntersection(
                    _mouse,
                    view.mouseRay0,
                    view.mouseRay1,
                    this.pos0,
                    view.mouseRayN
                );
                this.line.position.copy(this.pos0);
                _det.subVectors(_mouse, this.pos0);
                const len = _det.length();
                _det.divideScalar(len);
                this.line.scale.setScalar(len);
                this.line.quaternion.setFromUnitVectors(_unitX, _det);
                _mat1.copy(this.mat0).scale(_scale.setScalar(len / this.len0));
                for (let i = 0; i < this.nodes.length; ++i) {
                    const node = this.nodes[i];
                    _mat.copy(node.getParentWorldMatrix()).invert().multiply(_mat1);
                    if (i > 0) {
                        _mat.multiply(this.detMat[i - 1]);
                    }
                    _mat.decompose(_pos, _rot, _scale);
                    ctx.history.setValue(node, CScale, _scale.x);
                    if (i > 0) {
                        ctx.history.setValue(node, CPosition, new Vector3().copy(_pos));
                        ctx.history.setValue(node, CRotation, new Euler().setFromQuaternion(_rot));
                    }
                }
                if (this.nodes[0].has(CObject3D)) {
                    const object3D = this.nodes[0].value(CObject3D);
                    if (object3D) {
                        _box.setFromObject(object3D);
                        const dx = (_box.max.x - _box.min.x).toFixed(2);
                        const dy = (_box.max.y - _box.min.y).toFixed(2);
                        const dz = (_box.max.z - _box.min.z).toFixed(2);
                        ctx.proxiedRef.statusBarMessage = `${dx} × ${dy} × ${dz}`;
                    }
                }
            } else {
                this.dragging = false;
                this.draggingViewIndex = -1;
            }
        } else if (input.mouseOver) {
            if (input.mouseLeftDownThisFrame) {
                this.mat0.copy(this.nodes[0].getWorldMatrix());
                getTranslation(this.pos0, this.mat0);
                this.detMat.length = this.nodes.length - 1;
                if (this.detMat.length) {
                    _mat.copy(this.nodes[0].getWorldMatrix()).invert();
                    for (let i = 0; i < this.detMat.length; ++i) {
                        if (!this.detMat[i]) {
                            this.detMat[i] = new Matrix4();
                        }
                        this.detMat[i].multiplyMatrices(_mat, this.nodes[i + 1].getWorldMatrix());
                    }
                }
                linePanelIntersection(
                    _mouse,
                    view.mouseRay0,
                    view.mouseRay1,
                    this.pos0,
                    view.mouseRayN
                );
                this.dragging = true;
                this.draggingViewIndex = view.index;
                this.len0 = _det.subVectors(_mouse, this.pos0).length();
                return;
            }
        }
    }
}
