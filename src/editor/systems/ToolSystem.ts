import {BufferGeometry, LineBasicMaterial, LineSegments, Matrix4, Ray, Vector3} from 'three';
import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import CObject3D, {Object3DUserData} from '../model/components/CObject3D';
import EditorTool from '../tools/EditorTool';
import {xyCirclePoints} from '../utils/geometry/helper';
import {getScaleScalar} from '../utils/math';
import SelectionRect from '../utils/SelectionRect';
import UpdateSystem from '../utils/UpdateSystem';

const _forward = new Vector3(0, 0, 1);
const _pos = new Vector3();
const _invMat = new Matrix4();
const _normal = new Vector3();
const _ray = new Ray();

export default class ToolSystem extends UpdateSystem<EditorContext> {

    private prevTool?: EditorTool;

    private selectionRect = new SelectionRect();
    private dragMovedFramesCount = 0;

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
        const tool = ctx.tool;

        // selection rect
        ctx.selectionRectSetThisFrame = false;
        if (tool.enableSelectionRect) {
            for (let view of ctx.views) {
                view = toRaw(view);
                if (!view.enabled) {
                    continue;
                }
                const input = view.input;
                if (input.mouseOver) {
                    if (input.mouseLeft) {
                        const x = Math.max(-1, Math.min(1, view.mouseNdc.x));
                        const y = Math.max(-1, Math.min(1, view.mouseNdc.y));
                        if (ctx.selectionRectDragging) {
                            // drag move
                            this.selectionRect.setPoint2(x, y);
                            ctx.selectionEnd.set(x, y);
                            if (this.dragMovedFramesCount < 2) {
                                this.selectionRect.hide();
                                if (this.dragMovedFramesCount || !ctx.selectionStart.equals(ctx.selectionEnd)) {
                                    this.dragMovedFramesCount += 1;
                                }
                            }
                        } else {
                            // drag start
                            ctx.selectionRectDragging = true;
                            ctx.selectionRectViewIndex = view.index;
                            this.selectionRect.attach(view.element);
                            this.selectionRect.setPoint1(x, y);
                            this.selectionRect.setPoint2(x, y);
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
                    this.selectionRect.hide();
                    if (tool.enableDefaultSelectionBehavior) {
                        if (ctx.selectionStart.equals(ctx.selectionEnd)) {
                            const result = view.mousePick();
                            let id = 0;
                            for (let obj of result) {
                                const node = (result[0].object.userData as Object3DUserData).node;
                                if (node) {
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
                            } else {
                                if (!view.input.isKeyPressed('Control')) {
                                    ctx.model.selected = [];
                                }
                            }
                        } else {
                            const result = this.selectionRect.select(
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
                                    ctx.model.addSelection(node.id);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            this.selectionRect.hide();
            ctx.selectionRectDragging = false;
        }

        // sculpt brush indicator
        do {
            this.sculptIndicator.visible = false;
            this.sculptIndicatorSym.visible = false;
            ctx.sculptHovered = false;
            ctx.sculptSym = ctx.symmetry !== 'no';
            if (!tool.sculpt) {
                break;
            }
            const clay = ctx.readonlyRef().model.getSelectedNodes().filter(node => node.type === 'Clay')[0];
            if (!clay) {
                break;
            }
            const mesh = clay.get(CObject3D).mesh;
            if (!mesh) {
                break;
            }
            for (let view of ctx.views) {
                view = toRaw(view);
                if (!view.enabled) {
                    continue;
                }
                const input = view.input;
                if (!input.mouseOver) {
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

                ctx.sculptHovered = true;

                this.sculptIndicator.visible = true;
                this.sculptIndicatorSym.visible = ctx.sculptSym;

                this.sculptIndicator.position.copy(result.point).applyMatrix4(mat);
                _normal.copy(result.normal).transformDirection(mat);
                this.sculptIndicator.quaternion.setFromUnitVectors(_forward, _normal);

                _pos.copy(result.point).project(view.camera.get());
                _pos.x += tool.brushRadius / view.height;
                _pos.unproject(view.camera.get());
                const brushSize = _pos.distanceTo(result.point);
                this.sculptIndicator.scale.setScalar(brushSize);

                ctx.sculptRadius = brushSize * getScaleScalar(_invMat);
                ctx.sculptLocal.copy(result.point);
                ctx.sculptNormal.copy(result.normal);
                ctx.sculptLocalSym.copy(ctx.sculptLocal);
                ctx.sculptNormalSym.copy(ctx.sculptNormal);
                switch (ctx.symmetry) {
                    case 'x':
                        ctx.sculptLocalSym.x *= -1;
                        ctx.sculptNormalSym.x *= -1;
                        break;
                    case 'y':
                        ctx.sculptLocalSym.y *= -1;
                        ctx.sculptNormalSym.y *= -1;
                        break;
                    case 'z':
                        ctx.sculptLocalSym.z *= -1;
                        ctx.sculptNormalSym.z *= -1;
                        break;
                }

                if (this.sculptIndicatorSym.visible) {
                    this.sculptIndicatorSym.position.copy(ctx.sculptLocalSym).applyMatrix4(mat);
                    _normal.copy(ctx.sculptNormalSym).transformDirection(mat);
                    this.sculptIndicatorSym.quaternion.setFromUnitVectors(_forward, _normal);
                    this.sculptIndicatorSym.scale.copy(this.sculptIndicator.scale);
                }
                break;
            }
        } while (false);

        tool.begin(ctx);

        for (let view of ctx.views) {
            view = toRaw(view);
            if (tool.enableTransformControls) {
                view.transformControls.attach(ctx.dummyObject);
            } else {
                view.transformControls.detach();
            }
            if (view.enabled) {
                tool.update(ctx, view);
            }
        }

        tool.end(ctx);

        if (this.prevTool !== tool) {
            this.prevTool?.onUnselected(ctx);
            this.prevTool = tool;
            ctx.statusBarMessage = tool.tips;
        }
    }

    end(ctx: EditorContext): void {
    }

}
