import {BufferGeometry, LineBasicMaterial, LineSegments, Matrix4, Ray, Vector3} from 'three';
import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import CGeom3 from '../model/components/CGeom3';
import CObject3D, {Object3DUserData} from '../model/components/CObject3D';
import CSymmetry from '../model/components/CSymmetry';
import ModelNode from '../model/ModelNode';
import EditorTool from '../tools/EditorTool';
import {xyCirclePoints} from '../utils/geometry/helper';
import {getScaleScalar} from '../utils/math';
import UpdateSystem from '../utils/UpdateSystem';

const _forward = new Vector3(0, 0, 1);
const _pos = new Vector3();
const _invMat = new Matrix4();
const _normal = new Vector3();
const _ray = new Ray();

export default class ToolSystem extends UpdateSystem<EditorContext> {

    private prevTool?: EditorTool;

    private dragMovedFramesCount = 0;
    private sculptPicked = false;
    private sculptStroked = false;

    private sculptIndicator = new LineSegments(
        new BufferGeometry().setFromPoints([
            ...xyCirclePoints(1),
            ...xyCirclePoints(0.05)
        ]),
        new LineBasicMaterial({
            fog: false,
            toneMapped: false,
            transparent: true,
            color: 0xf3982d,
            opacity: 1,
        }),
    );
    private sculptIndicatorSym = new LineSegments(
        this.sculptIndicator.geometry.clone(),
        this.sculptIndicator.material.clone(),
    );

    setup(ctx: EditorContext) {
        this.sculptIndicator.visible = false;
        ctx.scene.add(this.sculptIndicator);
        this.sculptIndicatorSym.visible = false;
        this.sculptIndicatorSym.material.opacity = 0.33;
        ctx.scene.add(this.sculptIndicatorSym);
    }

    begin(ctx: EditorContext): void {
        const tool = toRaw(ctx.tool);

        // selection rect
        ctx.selectionRectSetThisFrame = false;
        if (tool.enableSelectionRect) {
            for (let view of ctx.views) {
                view = toRaw(view);
                if (!view.enabled) {
                    continue;
                }
                const input = view.input;
                if (input.pointerOver) {
                    if (input.mouseLeft) {
                        const x = Math.max(-1, Math.min(1, view.mouseNdc.x));
                        const y = Math.max(-1, Math.min(1, view.mouseNdc.y));
                        if (ctx.selectionRectDragging) {
                            // drag move
                            ctx.selectionRect.setPoint2(x, y);
                            ctx.selectionEnd.set(x, y);
                            if (this.dragMovedFramesCount < 2) {
                                ctx.selectionRect.hide();
                                if (this.dragMovedFramesCount || !ctx.selectionStart.equals(ctx.selectionEnd)) {
                                    this.dragMovedFramesCount += 1;
                                }
                            }
                        } else {
                            // drag start
                            ctx.selectionRectDragging = true;
                            ctx.selectionRectViewIndex = view.index;
                            ctx.selectionRect.attach(view.element);
                            ctx.selectionRect.setPoint1(x, y);
                            ctx.selectionRect.setPoint2(x, y);
                            ctx.selectionStart.set(x, y);
                            ctx.selectionEnd.set(x, y);
                            this.dragMovedFramesCount = 0;
                        }
                    }
                }
                // drag end
                if (ctx.selectionRectDragging && ctx.selectionRectViewIndex === view.index && !input.mouseLeft) {
                    ctx.selectionRectDragging = false;
                    ctx.selectionRectSetThisFrame = true;
                    ctx.selectionRect.hide();
                    if (tool.enableDefaultSelectionBehavior) {
                        if (ctx.selectionStart.equals(ctx.selectionEnd)) {
                            const result = view.mousePick();
                            let id = 0;
                            for (let obj of result) {
                                const node = (obj.object.userData as Object3DUserData).node;
                                if (node?.visible) {
                                    if (!ctx.options.allowSelectingInvisibleObjectByClicking) {
                                        if (node.has(CGeom3) && node.parent?.has(CGeom3)) {
                                            continue;
                                        }
                                    }
                                    id = node.id;
                                    break;
                                }
                            }
                            if (id) {
                                if (ctx.model.selected.includes(id)) {
                                    if (view.input.isKeyPressed('Control')) {
                                        ctx.model.selected = ctx.model.selected.filter(curr => curr !== id);
                                    }
                                } else {
                                    if (!view.input.isKeyPressed('Control')) {
                                        ctx.model.selected = [];
                                    }
                                    ctx.model.addSelection(id);
                                }
                                if (input.doubleClick) {
                                    let node: ModelNode | null = ctx.model.getNode(id);
                                    node = node.parent;
                                    while (node) {
                                        node.expanded = true;
                                        node = node.parent;
                                    }
                                }
                            } else {
                                if (!view.input.isKeyPressed('Control')) {
                                    ctx.model.selected = [];
                                }
                            }
                        } else {
                            const result = ctx.selectionRect.select(
                                view.camera.get(),
                                ctx.readonlyRef().scene.children.filter(
                                    obj => obj.visible && !!(obj.userData as Object3DUserData).node
                                )
                            );
                            if (!view.input.isKeyPressed('Control')) {
                                ctx.model.selected = [];
                            }
                            for (let obj of result) {
                                const node = (obj.userData as Object3DUserData).node;
                                if (node) {
                                    if (!ctx.options.allowSelectingInvisibleObjectByClicking) {
                                        if (node.has(CGeom3) && node.parent?.has(CGeom3)) {
                                            continue;
                                        }
                                    }
                                    ctx.model.addSelection(node.id);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            ctx.selectionRect.hide();
            ctx.selectionRectDragging = false;
        }

        // sculpt brush indicator
        do {
            this.sculptIndicator.visible = false;
            this.sculptIndicatorSym.visible = false;
            ctx.sculptNodeId = 0;
            ctx.sculptSym = false;
            ctx.sculptMoved = false;
            if (this.sculptPicked) {
                let mouseLeft = false;
                for (let view of ctx.views) {
                    if (view.input.mouseLeft) {
                        mouseLeft = true;
                        break;
                    }
                }
                if (!mouseLeft) {
                    this.sculptPicked = false;
                }
                break;
            }
            if (!tool.sculpt) {
                break;
            }
            const clay = ctx.readonlyRef().model.getSelectedNodes().filter(node => node.type === 'Clay' && !node.instanceId && node.visible)[0];
            if (!clay) {
                break;
            }
            const mesh = clay.get(CObject3D).mesh;
            if (!mesh) {
                break;
            }
            ctx.sculptNodeId = clay.id;
            ctx.sculptSym = clay.value(CSymmetry) !== 'none';
            for (let view of ctx.views) {
                view = toRaw(view);
                if (!view.enabled) {
                    continue;
                }
                const input = view.input;
                if (input.mouseLeft) {
                    if (input.pointerOver || ctx.sculptActiveView === view.index) {
                        ctx.sculptActiveView = view.index;
                        if (input.mouseLeftDownThisFrame) {
                            ctx.sculptMoved = true;
                            ctx.sculptStartThisFrame = true;
                            ctx.sculptX0 = ctx.sculptX1 = input.pointerX;
                            ctx.sculptY0 = ctx.sculptY1 = input.pointerY;
                            this.sculptStroked = false;
                        } else if (ctx.sculptX1 !== input.pointerX || ctx.sculptY1 !== input.pointerY) {
                            ctx.sculptMoved = true;
                            ctx.sculptStartThisFrame = false;
                            ctx.sculptX0 = ctx.sculptX1;
                            ctx.sculptY0 = ctx.sculptY1;
                            ctx.sculptX1 = input.pointerX;
                            ctx.sculptY1 = input.pointerY;
                            this.sculptStroked = true;
                        }
                    }
                } else if (ctx.sculptActiveView === view.index) {
                    ctx.sculptActiveView = -1;
                    // mouse release
                    if (!this.sculptStroked && input.pointerOver) {
                        // click select
                        ctx.model.selected.length = 0;
                        for (let picking of view.mousePick()) {
                            const node = (picking.object.userData as Object3DUserData).node;
                            if (node?.type === 'Clay') {
                                ctx.model.addSelection(node.id);
                                this.sculptPicked = true;
                                ctx.sculptActiveView = -1;
                                break;
                            }
                        }
                    }
                }
                if (!input.pointerOver) {
                    continue;
                }

                const mat = clay.getWorldMatrix();
                _invMat.copy(mat).invert();

                _ray.copy(view.raycaster.ray);
                _ray.applyMatrix4(_invMat);
                const result = mesh.raycast(_ray, true)[0];
                if (!result) {
                    break;
                }

                if (input.mouseLeft) {
                    this.sculptStroked = true;
                } else {
                    this.sculptIndicator.visible = true;
                    this.sculptIndicatorSym.visible = ctx.sculptSym;
                }

                this.sculptIndicator.position.copy(result.point).applyMatrix4(mat);
                _normal.copy(result.normal).transformDirection(mat);
                this.sculptIndicator.quaternion.setFromUnitVectors(_forward, _normal);

                let brushSize = tool.brushRadius / view.height;
                if (view.camera.perspective) {
                    brushSize *= this.sculptIndicator.position.distanceTo(view.camera._position);
                } else {
                    brushSize *= (view.camera.orthographicCamera.top - view.camera.orthographicCamera.bottom);
                }
                this.sculptIndicator.scale.setScalar(brushSize);
                ctx.sculptLocalRadius = brushSize * getScaleScalar(_invMat);

                if (this.sculptIndicatorSym.visible) {
                    _pos.copy(result.point);
                    _normal.copy(result.normal);
                    switch (clay.value(CSymmetry)) {
                        case 'x':
                            _pos.x *= -1;
                            _normal.x *= -1;
                            break;
                        case 'y':
                            _pos.y *= -1;
                            _normal.y *= -1;
                            break;
                        case 'z':
                            _pos.z *= -1;
                            _normal.z *= -1;
                            break;
                    }
                    this.sculptIndicatorSym.position.copy(_pos).applyMatrix4(mat);
                    _normal.transformDirection(mat);
                    this.sculptIndicatorSym.quaternion.setFromUnitVectors(_forward, _normal);
                    this.sculptIndicatorSym.scale.copy(this.sculptIndicator.scale);
                }
                break;
            }
        } while (false);

        // update tool
        tool.begin(ctx);
        for (let view of ctx.views) {
            view = toRaw(view);
            if (view.enabled) {
                tool.update(ctx, view);
            }
        }
        tool.end(ctx);

        // mouse picking for sculpt tool
        if (tool.sculpt && !ctx.sculptNodeId) {
            for (let view of ctx.views) {
                view = toRaw(view);
                const input = view.input;
                if (input.pointerOver && input.mouseLeftDownThisFrame) {
                    for (let picking of view.mousePick()) {
                        const node = (picking.object.userData as Object3DUserData).node;
                        if (node?.type === 'Clay') {
                            ctx.model.addSelection(node.id);
                            this.sculptPicked = true;
                            ctx.sculptActiveView = -1;
                            break;
                        }
                    }
                }
            }
        }

        // update tool tips
        if (toRaw(this.prevTool) !== tool) {
            this.prevTool?.onUnselected(ctx);
            this.prevTool = tool;
            ctx.statusBarMessage = tool.tips;
        }

        // save options
        if (tool.optionsProps.length) {
            const options = ctx.options.tools[tool.constructor.name] = ctx.options.tools[tool.constructor.name] || {};
            for (let prop of tool.optionsProps) {
                options[prop] = tool[prop as keyof EditorTool];
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
