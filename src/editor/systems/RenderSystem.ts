import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class RenderSystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        const rect = ctx.canvas.getBoundingClientRect();
        const renderer = ctx.renderer;
        renderer.setScissorTest(true);
        renderer.setClearColor(0x000000, 0.0);
        renderer.clear();
        for (let curr of ctx.views) {
            for (let view of ctx.views) {
                const active = curr === view;
                view.transformControls.visible = active && ctx.tool.enableTransformControls;
                view.defaultLight.visible = active;
                view.grids.visible = active;
            }
            if (curr.enabled) {
                if (curr.width && curr.height) {
                    ctx.tool.beforeRender(ctx, curr);
                    renderer.setViewport(-rect.left + curr.left, rect.bottom - curr.bottom, curr.width, curr.height);
                    renderer.setScissor(-rect.left + curr.left, rect.bottom - curr.bottom, curr.width, curr.height);
                    renderer.render(ctx.scene, curr.camera.get());
                }
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
