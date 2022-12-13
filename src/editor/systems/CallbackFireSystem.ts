import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class CallbackFireSystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        for (let callback of ctx.nextFrameCallbacks) {
            callback();
        }
        ctx.nextFrameCallbacks.length = 0;
        const time = Date.now();
        for (let pair of ctx.throttleTasks.entries()) {
            if (pair[1].time <= time) {
                pair[1].callback();
                ctx.throttleTasks.delete(pair[0]);
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
