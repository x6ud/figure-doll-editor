import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class CallbackFireSystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        for (let callback of ctx.nextFrameCallbacks) {
            callback();
        }
        ctx.nextFrameCallbacks.length = 0;
    }

    end(ctx: EditorContext): void {
    }

}
