import {AmbientLight} from 'three';
import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class DefaultLightUpdateSystem extends UpdateSystem<EditorContext> {
    private ambientLight = new AmbientLight(0xffffff, 0.5);

    setup(ctx: EditorContext) {
        ctx.scene.add(this.ambientLight);
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        for (let view of ctx.views) {
            if (!view.enabled) {
                continue;
            }
            const light = view.defaultLight;
            light.intensity = 0.5;
            light.position.copy(view.camera._position);
            light.up.copy(view.camera._up);
            light.lookAt(view.camera.target);
        }
    }

    end(ctx: EditorContext): void {
    }
}
