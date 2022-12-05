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
        for (let view of ctx.views) {
            for (let view2 of ctx.views) {
                view2.transformControls.visible = view === view2 && ctx.tool.enableTransformControls;
                view2.defaultLight.visible = view === view2;
            }
            if (view.enabled) {
                if (view.width && view.height) {
                    ctx.xzGrids.visible = ctx.showGrids && (view.index === ctx.mainViewIndex || view.index === 0);
                    ctx.yzGrids.visible = ctx.showGrids && view.index === 2;
                    ctx.xyGrids.visible = ctx.showGrids && view.index === 3;
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
