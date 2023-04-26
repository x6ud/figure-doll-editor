import {DirectionalLightHelper, HemisphereLightHelper, PointLightHelper, SpotLightHelper} from 'three';
import EditorContext from '../../EditorContext';
import CLightHelper from '../../model/components/CLightHelper';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class LightHelperUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.has(CLightHelper)) {
            const cLightHelper = node.get(CLightHelper);
            const lightHelper = cLightHelper.value as (
                HemisphereLightHelper | DirectionalLightHelper | PointLightHelper | SpotLightHelper
                );
            if (lightHelper) {
                lightHelper.update();
            }
            const cameraHelper = cLightHelper.camera;
            if (cameraHelper) {
                cameraHelper.update();
            }
        }
    }
}
