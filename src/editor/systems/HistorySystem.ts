import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class HistorySystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        ctx.history.update();
    }

    end(ctx: EditorContext): void {
    }

}
