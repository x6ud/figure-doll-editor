import {AmbientLight, Light} from 'three';
import EditorContext from '../EditorContext';
import CObject3D from '../model/components/CObject3D';
import UpdateSystem from '../utils/UpdateSystem';

const LIGHT_TYPES = new Set(['AmbientLight', 'DirectionalLight']);

export default class LightUpdateSystem extends UpdateSystem<EditorContext> {
    private ambientLight = new AmbientLight(0xffffff, 0.5);

    setup(ctx: EditorContext) {
        ctx.scene.add(this.ambientLight);
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (ctx.options.shadingMode === 'solid') {
            this.ambientLight.visible = true;
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
        } else {
            this.ambientLight.visible = false;
        }
        const useRealLights = ctx.options.shadingMode === 'rendered';
        for (let node of ctx.model.nodes) {
            if (LIGHT_TYPES.has(node.type)) {
                const light = node.value(CObject3D) as Light;
                if (light) {
                    light.visible = useRealLights;
                }
            }
        }
    }

    end(ctx: EditorContext): void {
    }
}
