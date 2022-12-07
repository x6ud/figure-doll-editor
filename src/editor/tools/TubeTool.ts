import {Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CTube, {TubeNodePickerUserData} from '../model/components/CTube';
import ModelNode from '../model/ModelNode';
import {intersectPointRect, linePanelIntersection} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './Tube.png';

const _pos = new Vector3();
const _mouse1 = new Vector3();
const _det = new Vector3();
const _rot = new Quaternion();

export default class TubeTool extends EditorTool {
    label = 'Tube';
    icon = icon;
    enableDefaultDeleteShortcut = false;
    enableSelectionRect = true;
    enableDefaultSelectionBehavior = false;

    private nodes: ModelNode[] = [];
    private enableDeleteThisFrame = true;

    private dragging = false;
    private mouseMoved = false;
    private draggingActiveViewIndex = -1;
    private mouse0 = new Vector3();

    begin(ctx: EditorContext) {
        for (let node of this.nodes) {
            if (node.deleted) {
                continue;
            }
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = false;
            }
            if (!ctx.model.selected.includes(node.id)) {
                cTube.selected.length = 0;
            }
        }
        this.enableDefaultDeleteShortcut = true;
        this.enableDeleteThisFrame = true;
        this.nodes = ctx.model.getSelectedNodes().filter(node => node.has(CTube));
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = true;
            }
            cTube.hovered = -1;
            if (cTube.selected.length) {
                this.enableDefaultDeleteShortcut = false;
            }
        }
        this.enableSelectionRect = true;
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;
        // delete
        if (input.isKeyPressed('Delete') && this.enableDeleteThisFrame) {
            this.enableDeleteThisFrame = false;
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                if (cTube.selected.length) {
                    const tube = cTube.clone().filter((_, i) => !cTube.selected.includes(i));
                    cTube.selected.length = 0;
                    ctx.history.setValue(node, CTube, tube);
                }
            }
            return;
        }
        // drag move
        if (this.dragging && view.index === this.draggingActiveViewIndex) {
            if (this.mouseMoved) {
                this.enableSelectionRect = false;
            }
            if (input.mouseLeft) {
                if (linePanelIntersection(
                    _mouse1,
                    view.mouseRay0, view.mouseRay1,
                    this.mouse0, view.mouseRayN
                )) {
                    _det.subVectors(_mouse1, this.mouse0);
                    if (_det.lengthSq() > 1e-6) {
                        this.mouseMoved = true;
                    }
                    for (let node of this.nodes) {
                        const cTube = node.get(CTube);
                        if (cTube.selected.length || cTube.draggingStartNodeIndex >= 0) {
                            const val = cTube.clone(cTube.draggingStartValue!);
                            for (let index of cTube.selected) {
                                val[index].position
                                    .applyMatrix4(cTube.draggingStartMatrix!)
                                    .add(_det)
                                    .applyMatrix4(cTube.draggingStartInvMatrix!);
                            }
                            if (cTube.draggingStartNodeIndex >= 0
                                && !cTube.selected.includes(cTube.draggingStartNodeIndex)
                            ) {
                                val[cTube.draggingStartNodeIndex].position
                                    .applyMatrix4(cTube.draggingStartMatrix!)
                                    .add(_det)
                                    .applyMatrix4(cTube.draggingStartInvMatrix!);
                            }
                            ctx.history.setValue(node, CTube, val);
                        }
                    }
                }
            } else {
                // drag end
                this.dragging = false;
                this.draggingActiveViewIndex = -1;
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    cTube.draggingStartNodeIndex = -1;
                }
            }
        }
        // find hovered
        if (input.mouseOver && !this.dragging) {
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                const result = view.raycaster.intersectObjects(cTube.pickers);
                if (result.length) {
                    const index = (result[0].object.userData as TubeNodePickerUserData).index;
                    cTube.hovered = index == null ? -1 : index;

                    // drag start
                    if (input.mouseLeftDownThisFrame) {
                        this.dragging = true;
                        this.mouseMoved = false;
                        this.draggingActiveViewIndex = view.index;
                        this.mouse0.copy(result[0].point);
                        cTube.draggingStartNodeIndex = cTube.hovered;
                    }
                } else {
                    cTube.hovered = -1;
                }
            }
            // save dragging start state
            if (this.dragging && view.index === this.draggingActiveViewIndex) {
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (cTube.selected.length || cTube.draggingStartNodeIndex >= 0) {
                        cTube.draggingStartMatrix = new Matrix4().copy(node.getWorldMatrix());
                        cTube.draggingStartInvMatrix = new Matrix4().copy(node.getWorldMatrix()).invert();
                        cTube.draggingStartValue = cTube.clone();
                    }
                }
            }
        }
        // select
        if (ctx.selectionRectSetThisFrame
            && ctx.selectionRectViewIndex === view.index
        ) {
            if (ctx.selectionStart.equals(ctx.selectionEnd)) {
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (!input.isKeyPressed('Control')) {
                        cTube.selected.length = 0;
                    }
                    if (cTube.hovered >= 0) {
                        cTube.addSelection(cTube.hovered);
                    }
                }
            } else {
                const camera = view.camera.get();
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (!input.isKeyPressed('Control')) {
                        cTube.selected.length = 0;
                    }
                    for (let obj of cTube.pickers) {
                        _pos.setFromMatrixPosition(obj.matrixWorld).project(camera);
                        if (intersectPointRect(_pos, ctx.selectionStart, ctx.selectionEnd)) {
                            const index = (obj.userData as TubeNodePickerUserData).index;
                            if (index != null) {
                                cTube.addSelection(index);
                            }
                        }
                    }
                }
            }
        }
    }

    end(ctx: EditorContext) {
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            cTube.updateColor();
        }
    }

    beforeRender(ctx: EditorContext, view: EditorView) {
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            _rot.setFromRotationMatrix(node.getWorldMatrix()).invert();
            for (let circle of cTube.circles) {
                circle.quaternion.copy(_rot).multiply(view.camera.get().quaternion);
            }
        }
    }

    onUnselected(ctx: EditorContext) {
        for (let node of this.nodes) {
            if (node.deleted) {
                continue;
            }
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = false;
            }
            cTube.selected.length = 0;
        }
        this.nodes.length = 0;
    }
}
