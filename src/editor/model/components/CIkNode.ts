import {Material, Object3D, Points, Quaternion, Vector3} from 'three';
import EditorContext from '../../EditorContext';
import EditorView from '../../EditorView';
import ModelNode from '../ModelNode';
import ModelNodeComponent from '../ModelNodeComponent';
import {registerModelComponent} from '../ModelNodeComponentDef';
import {disposeObject3D} from './CObject3D';

const HANDLER_SIZE = 24;
const _scr = new Vector3();

@registerModelComponent({})
export default class CIkNode extends ModelNodeComponent<void> {
    value = undefined;

    dirty = true;
    /** Ik bone start position in ik chain local space */
    start = new Vector3();
    /** Ik bone end position in ik chain local space */
    end = new Vector3();
    /** Ik bone rotation in ik chain local space */
    quaternion = new Quaternion();
    boneMesh?: Object3D;
    hingeIndicator?: Object3D;
    moveHandler?: Points;
    rotateHandler?: Points;
    moveHandlerHovered = false;
    moveHandlerZ = 0;
    rotateHandlerHovered = false;
    rotateHandlerZ = 0;
    hingeEnabled = false;

    onRemoved() {
        if (this.boneMesh) {
            disposeObject3D(this.boneMesh);
            this.boneMesh.removeFromParent();
        }
        if (this.hingeIndicator) {
            disposeObject3D(this.hingeIndicator);
            this.hingeIndicator.removeFromParent();
        }
        if (this.moveHandler) {
            this.moveHandler.geometry.dispose();
            (this.moveHandler.material as Material)?.dispose();
            this.moveHandler.removeFromParent();
        }
        if (this.rotateHandler) {
            this.rotateHandler.geometry.dispose();
            (this.rotateHandler.material as Material)?.dispose();
            this.rotateHandler.removeFromParent();
        }
    }

    updateHandlersHoverState(node: ModelNode, view: EditorView) {
        if (this.moveHandler?.visible) {
            _scr.copy(this.start).applyMatrix4(node.getParentWorldMatrix()).project(view.camera.get());
            _scr.x += 1;
            _scr.y += 1;
            _scr.x *= view.width / 2;
            _scr.y *= view.height / 2;
            this.moveHandlerZ = _scr.z;
            if (Math.abs(view.mouseScr.x - _scr.x) <= HANDLER_SIZE / 2
                && Math.abs(view.mouseScr.y - _scr.y) <= HANDLER_SIZE / 2
            ) {
                this.moveHandlerHovered = true;
            }
        }
        if (this.rotateHandler?.visible) {
            _scr.copy(this.end).applyMatrix4(node.getParentWorldMatrix()).project(view.camera.get());
            _scr.x += 1;
            _scr.y += 1;
            _scr.x *= view.width / 2;
            _scr.y *= view.height / 2;
            this.rotateHandlerZ = _scr.z;
            if (Math.sqrt((view.mouseScr.x - _scr.x) ** 2 + (view.mouseScr.y - _scr.y) ** 2) <= HANDLER_SIZE / 2) {
                this.rotateHandlerHovered = true;
            }
        }
        if (this.moveHandlerHovered && this.rotateHandlerHovered) {
            if (this.moveHandlerZ < this.rotateHandlerZ) {
                this.rotateHandlerHovered = false;
            } else {
                this.moveHandlerHovered = false;
            }
        }
    }

    resetHandlers(ctx: EditorContext) {
        this.moveHandlerHovered = false;
        this.rotateHandlerHovered = false;
        if (this.boneMesh) {
            this.boneMesh.visible = ctx.options.showIkBones;
        }
        if (this.hingeIndicator) {
            this.hingeIndicator.visible = ctx.options.showIkBones && this.hingeEnabled;
        }
        if (this.moveHandler) {
            this.moveHandler.visible = false;
        }
        if (this.rotateHandler) {
            this.rotateHandler.visible = false;
        }
    }
}
