import {AmbientLight, Light, Vector3} from 'three';
import EditorContext from '../EditorContext';
import CLightHelper from '../model/components/CLightHelper';
import CObject3D from '../model/components/CObject3D';
import {getModelNodeDef} from '../model/ModelNodeDef';
import UpdateSystem from '../utils/UpdateSystem';

export default class LightUpdateSystem extends UpdateSystem<EditorContext> {
    private ambientLight = new AmbientLight(0xffffff, 0.5);

    setup(ctx: EditorContext) {
        ctx.scene.add(this.ambientLight);
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (ctx.options.shadingMode === 'solid') {
            ctx.renderer.physicallyCorrectLights = false;
            this.ambientLight.visible = true;
            for (let view of ctx.views) {
                if (!view.enabled) {
                    continue;
                }
                const light = view.defaultLight;
                light.intensity = 0.5;
                light.position.copy(view.camera._position).addScaledVector(view.camera._dir, 2);
                light.up.copy(view.camera._up);
                light.lookAt(view.camera.target);
            }
        } else {
            this.ambientLight.visible = false;
            ctx.renderer.physicallyCorrectLights = true;
        }
        const useRealLights = ctx.options.shadingMode === 'rendered';
        const showLightHelpers = ctx.options.showLightHelpers;
        ctx.model.forEach(node => {
            if (getModelNodeDef(node.type).light) {
                const light = node.value(CObject3D) as Light;
                const visible = node.visible;
                if (light) {
                    light.visible = useRealLights && visible;
                }
                if (node.has(CLightHelper)) {
                    const cLightHelper = node.get(CLightHelper);
                    const selected = ctx.model.selected.includes(node.id)
                        || (!!node.children.length && ctx.model.selected.includes(node.children[0].id));
                    if (cLightHelper.value) {
                        cLightHelper.value.visible = visible && (showLightHelpers || selected);
                    }
                    if (cLightHelper.camera) {
                        cLightHelper.camera.visible = useRealLights && light.castShadow && visible && (showLightHelpers || selected);
                    }
                }
            }
        });
    }

    end(ctx: EditorContext): void {
    }
}
