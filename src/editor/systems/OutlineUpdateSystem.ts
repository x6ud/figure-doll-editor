import {Object3D, WebGLRenderer, WebGLRenderTarget} from 'three';
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass';
import EditorContext from '../EditorContext';
import CObject3D from '../model/components/CObject3D';
import UpdateSystem from '../utils/UpdateSystem';

export default class OutlineUpdateSystem extends UpdateSystem<EditorContext> {
    private selectedObjs: Object3D[] = [];
    private visibilityCache = new Map<Object3D, boolean>();

    setup(ctx: EditorContext) {
        // outline selected invisible objects
        ctx.outlinePass.render = (
            renderer: WebGLRenderer,
            writeBuffer: WebGLRenderTarget,
            readBuffer: WebGLRenderTarget,
            deltaTime: number,
            maskActive: boolean
        ) => {
            this.visibilityCache.clear();
            for (let object of this.selectedObjs) {
                let obj: Object3D | null = object;
                while (obj) {
                    if (!this.visibilityCache.has(obj)) {
                        this.visibilityCache.set(obj, obj.visible);
                    }
                    obj.visible = true;
                    obj = obj.parent;
                }
            }
            OutlinePass.prototype.render.call(
                ctx.outlinePass,
                renderer,
                writeBuffer,
                readBuffer,
                deltaTime,
                maskActive
            );
            for (let object of this.selectedObjs) {
                let obj: Object3D | null = object;
                while (obj) {
                    obj.visible = !!this.visibilityCache.get(obj);
                    obj = obj.parent;
                }
            }
        };

        // prevent outline transform controls
        const cache: boolean[] = [false, false, false, false];
        ctx.outlinePass.changeVisibilityOfNonSelectedObjects = (bVisible) => {
            if (bVisible) {
                for (let view of ctx.views) {
                    view.transformControls.visible = cache[view.index];
                }
            } else {
                for (let view of ctx.views) {
                    cache[view.index] = view.transformControls.visible;
                    view.transformControls.visible = false;
                }
            }
            OutlinePass.prototype.changeVisibilityOfNonSelectedObjects.call(ctx.outlinePass, bVisible);
        };
    }

    begin(ctx: EditorContext): void {
        if (!ctx.options.outlineSelected) {
            ctx.outlinePass.selectedObjects.length = 0;
            ctx.outlinePass.enabled = false;
            return;
        }
        const selected = ctx.readonlyRef().model.getTopmostSelectedNodes();
        this.selectedObjs.length = 0;
        for (let node of selected) {
            if (node.has(CObject3D) && node.visible && node.type !== 'CsgBezierControlPoint') {
                const obj = node.value(CObject3D);
                if (obj) {
                    this.selectedObjs.push(obj);
                }
            }
        }
        ctx.outlinePass.selectedObjects = this.selectedObjs;
        ctx.outlinePass.enabled = !!this.selectedObjs.length;
    }

    end(ctx: EditorContext): void {
    }
}
