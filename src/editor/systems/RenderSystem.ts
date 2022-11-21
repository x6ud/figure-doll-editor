import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class RenderSystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        const rect = ctx.canvas.getBoundingClientRect();
        const renderer = ctx.renderer;
        renderer.setScissorTest(true);
        renderer.setClearColor(0x000000, 0.0);
        renderer.clear();
        for (let view of ctx.views) {
            if (view.enabled) {
                if (view.width && view.height) {
                    renderer.setViewport(-rect.left + view.left, rect.bottom - view.bottom, view.width, view.height);
                    renderer.setScissor(-rect.left + view.left, rect.bottom - view.bottom, view.width, view.height);
                    renderer.render(ctx.scene, view.camera.get());
                }
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
