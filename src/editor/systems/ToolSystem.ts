import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import EditorTool from '../tools/EditorTool';
import UpdateSystem from '../utils/UpdateSystem';

export default class ToolSystem extends UpdateSystem<EditorContext> {

    private prevTool?: EditorTool;

    begin(ctx: EditorContext): void {
        const tool = ctx.tool;
        tool.begin(ctx);
        for (let view of ctx.views) {
            if (view.enabled) {
                if (tool.enableTransformControls) {
                    view.transformControls.attach(ctx.dummyObject);
                } else {
                    view.transformControls.detach();
                }
                tool.update(ctx, toRaw(view));
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
