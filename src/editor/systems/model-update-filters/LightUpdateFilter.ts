import {AmbientLight, CameraHelper, DirectionalLight, DirectionalLightHelper} from 'three';
import EditorContext from '../../EditorContext';
import CColor from '../../model/components/CColor';
import CIntensity from '../../model/components/CIntensity';
import CLightHelper from '../../model/components/CLightHelper';
import CObject3D from '../../model/components/CObject3D';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class LightUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        switch (node.type) {
            case 'AmbientLight': {
                const cObject3D = node.get(CObject3D);
                if (!cObject3D.value) {
                    cObject3D.value = new AmbientLight();
                }
                const light = cObject3D.value as AmbientLight;
                const color = node.value(CColor);
                light.color.setRGB(color[0], color[1], color[2]);
                light.intensity = node.value(CIntensity);
            }
                break;
            case 'DirectionalLight': {
                const cObject3D = node.get(CObject3D);
                if (!cObject3D.value) {
                    cObject3D.value = new DirectionalLight();
                }
                const light = cObject3D.value as DirectionalLight;
                light.castShadow = true;
                const color = node.value(CColor);
                light.color.setRGB(color[0], color[1], color[2]);
                light.intensity = node.value(CIntensity);
                const cLightHelper = node.get(CLightHelper);
                if (!cLightHelper.value) {
                    cLightHelper.value = new DirectionalLightHelper(light);
                    ctx.scene.add(cLightHelper.value);
                }
                const target = node.children[0];
                const targetCObject3D = target.get(CObject3D);
                targetCObject3D.parentChanged = false;
                if (!targetCObject3D.value) {
                    targetCObject3D.value = light.target;
                    ctx.scene.add(targetCObject3D.value);
                }
            }
        }
    }
}
