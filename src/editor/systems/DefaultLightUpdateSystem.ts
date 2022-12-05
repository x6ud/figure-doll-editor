import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class DefaultLightUpdateSystem extends UpdateSystem<EditorContext> {
    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        for (let view of ctx.views) {
            if (!view.enabled) {
                continue;
            }
            const light = view.defaultLight;
            light.position.copy(view.camera._position);
            light.up.copy(view.camera._up);
            light.lookAt(view.camera.target);
        }
    }

    end(ctx: EditorContext): void {
    }
}
