import {
    AmbientLight,
    CameraHelper,
    DirectionalLight,
    DirectionalLightHelper,
    HemisphereLight,
    HemisphereLightHelper,
    PointLight,
    PointLightHelper,
    SpotLight,
    SpotLightHelper
} from 'three';
import EditorContext from '../../EditorContext';
import CCastShadow from '../../model/components/CCastShadow';
import CColor from '../../model/components/CColor';
import CGroundColor from '../../model/components/CGroundColor';
import CIntensity from '../../model/components/CIntensity';
import CLightHelper from '../../model/components/CLightHelper';
import CMapSize from '../../model/components/CMapSize';
import CObject3D from '../../model/components/CObject3D';
import CPenumbra from '../../model/components/CPenumbra';
import CShadowMappingRange from '../../model/components/CShadowMappingRange';
import CSkyColor from '../../model/components/CSkyColor';
import CSpotLightAngle from '../../model/components/CSpotLightAngle';
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
            case 'HemisphereLight': {
                const cObject3D = node.get(CObject3D);
                if (!cObject3D.value) {
                    cObject3D.value = new HemisphereLight();
                }
                const light = cObject3D.value as HemisphereLight;
                const skyColor = node.value(CSkyColor);
                light.color.setRGB(skyColor[0], skyColor[1], skyColor[2]);
                const groundColor = node.value(CGroundColor);
                light.groundColor.setRGB(groundColor[0], groundColor[1], groundColor[2]);
                light.intensity = node.value(CIntensity);
                const cLightHelper = node.get(CLightHelper);
                if (!cLightHelper.value) {
                    cLightHelper.value = new HemisphereLightHelper(light, 0.25);
                    ctx.scene.add(cLightHelper.value);
                }
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
                light.shadow.camera.top = +range;
                light.shadow.camera.right = +range;
                light.shadow.camera.bottom = -range;
                light.shadow.camera.left = -range;
                light.shadow.camera.near = 0;
                light.shadow.camera.updateProjectionMatrix();
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
                break;
            case 'PointLight': {
                const cObject3D = node.get(CObject3D);
                let light = cObject3D.value as PointLight;
                const mapSize = Number.parseInt(node.value(CMapSize));
                if (light && light.shadow.mapSize.x !== mapSize) {
                    light.dispose();
                    light.removeFromParent();
                    cObject3D.value = null;
                    cObject3D.localTransformChanged = true;
                    cObject3D.worldTransformChanged = true;
                    cObject3D.parentChanged = true;
                }
                if (!cObject3D.value) {
                    light = cObject3D.value = new PointLight();
                    light.shadow.mapSize.set(mapSize, mapSize);
                }
                light.castShadow = node.value(CCastShadow);
                const color = node.value(CColor);
                light.color.setRGB(color[0], color[1], color[2]);
                light.intensity = node.value(CIntensity);
                const near = 0.005;
                if (light.shadow.camera.near !== near) {
                    light.shadow.camera.near = near;
                    light.shadow.camera.updateProjectionMatrix();
                }
                const cLightHelper = node.get(CLightHelper);
                let lightHelper = cLightHelper.value as PointLightHelper;
                if (lightHelper && lightHelper.light !== light) {
                    lightHelper.dispose();
                    lightHelper.removeFromParent();
                    cLightHelper.value = null;
                }
                if (!cLightHelper.value) {
                    cLightHelper.value = new PointLightHelper(light, 0.25);
                    ctx.scene.add(cLightHelper.value);
                }
            }
                break;
            case 'SpotLight': {
                const cObject3D = node.get(CObject3D);
                if (!cObject3D.value) {
                    cObject3D.value = new SpotLight();
                }
                const light = cObject3D.value as SpotLight;
                light.castShadow = node.value(CCastShadow);
                const color = node.value(CColor);
                light.color.setRGB(color[0], color[1], color[2]);
                light.intensity = node.value(CIntensity);
                light.angle = node.value(CSpotLightAngle) / 180 * Math.PI;
                light.penumbra = node.value(CPenumbra);
                const mapSize = Number.parseInt(node.value(CMapSize));
                if (light.shadow.mapSize.x !== mapSize) {
                    light.shadow.mapSize.set(mapSize, mapSize);
                    light.shadow.map?.setSize(mapSize, mapSize);
                    light.shadow.mapPass?.setSize(mapSize, mapSize);
                    light.shadow.dispose();
                }
                const near = 0.005;
                if (light.shadow.camera.near !== near) {
                    light.shadow.camera.near = near;
                    light.shadow.camera.updateProjectionMatrix();
                }
                const cLightHelper = node.get(CLightHelper);
                if (!cLightHelper.value) {
                    cLightHelper.value = new SpotLightHelper(light);
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
                break;
            default:
                break;
        }
    }
}
