import {AmbientLight, CameraHelper, DirectionalLight, DirectionalLightHelper} from 'three';
import EditorContext from '../../EditorContext';
import CCastShadow from '../../model/components/CCastShadow';
import CColor from '../../model/components/CColor';
import CIntensity from '../../model/components/CIntensity';
import CLightHelper from '../../model/components/CLightHelper';
import CMapSize from '../../model/components/CMapSize';
import CObject3D from '../../model/components/CObject3D';
import CShadowMappingRange from '../../model/components/CShadowMappingRange';
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
                light.castShadow = node.value(CCastShadow);
                const color = node.value(CColor);
                light.color.setRGB(color[0], color[1], color[2]);
                light.intensity = node.value(CIntensity);
                const mapSize = Number.parseInt(node.value(CMapSize));
                if (light.shadow.mapSize.x !== mapSize) {
                    light.shadow.mapSize.set(mapSize, mapSize);
                    light.shadow.map?.setSize(mapSize, mapSize);
                    light.shadow.mapPass?.setSize(mapSize, mapSize);
                    light.shadow.dispose();
                }
                const range = node.value(CShadowMappingRange) / 2;
                if (light.shadow.camera.top !== range) {
                    light.shadow.camera.top = +range;
                    light.shadow.camera.right = +range;
                    light.shadow.camera.bottom = -range;
                    light.shadow.camera.left = -range;
                    light.shadow.camera.updateProjectionMatrix();
                }
                const cLightHelper = node.get(CLightHelper);
                if (!cLightHelper.value) {
                    cLightHelper.value = new DirectionalLightHelper(light);
                    ctx.scene.add(cLightHelper.value);
                }
                if (!cLightHelper.camera) {
                    cLightHelper.camera = new CameraHelper(light.shadow.camera);
                    ctx.scene.add(cLightHelper.camera);
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
