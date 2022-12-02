import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class ToolSystem extends UpdateSystem<EditorContext> {

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
    }

    end(ctx: EditorContext): void {
    }

}
