import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import {Object3DUserData} from '../model/components/CObject3D';
import EditorTool from '../tools/EditorTool';
import SelectionRect from '../utils/SelectionRect';
import UpdateSystem from '../utils/UpdateSystem';

export default class ToolSystem extends UpdateSystem<EditorContext> {

    private prevTool?: EditorTool;
    private selectionRect = new SelectionRect();

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
                        } else {
                            // drag start
                            ctx.selectionRectDragging = true;
                            ctx.selectionRectViewIndex = view.index;
                            this.selectionRect.attach(view.element);
                            this.selectionRect.setPoint1(x, y);
                            this.selectionRect.setPoint2(x, y);
                            ctx.selectionStart.set(x, y);
                            ctx.selectionEnd.set(x, y);
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
                            if (!view.input.isKeyPressed('Control')) {
                                ctx.model.selected = [];
                            }
                            for (let obj of result) {
                                const node = (result[0].object.userData as Object3DUserData).node;
                                if (node) {
                                    ctx.model.addSelection(node.id);
                                    break;
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
