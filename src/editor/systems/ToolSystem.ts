import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class ToolSystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        const tool = ctx.tool;
        tool.begin(ctx);
        for (let view of ctx.views) {
            if (view.enabled) {
                tool.update(ctx, toRaw(view));
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
