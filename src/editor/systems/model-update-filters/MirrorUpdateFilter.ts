import {Color, PlaneGeometry, ShaderMaterial} from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector';
import EditorContext from '../../EditorContext';
import CColor from '../../model/components/CColor';
import CHeight from '../../model/components/CHeight';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import CTextureSize from '../../model/components/CTextureSize';
import CWidth from '../../model/components/CWidth';
import ModelNode from '../../model/ModelNode';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class MirrorUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.type !== 'Mirror') {
            return;
        }
        const width = node.value(CWidth);
        const height = node.value(CHeight);
        const cObject3D = node.get(CObject3D);
        if (!cObject3D.value) {
            const color = node.value(CColor);
            cObject3D.value = new Reflector(
                new PlaneGeometry(width, height),
                {
                    color: new Color().setRGB(color[0], color[1], color[2]),
                }
            );
            (cObject3D.value.userData as Object3DUserData).node = node;
            return;
        }
        const reflector = cObject3D.value as Reflector;
        const panel = reflector.geometry as PlaneGeometry;
        if (panel.parameters.width !== width || panel.parameters.height !== height) {
            panel.dispose();
            (cObject3D.value as Reflector).geometry = new PlaneGeometry(width, height);
        }
        const uColor = (reflector.material as ShaderMaterial).uniforms.color.value as Color;
        const color = node.value(CColor);
        uColor.setRGB(color[0], color[1], color[2]);
        const textureSize = Number.parseInt(node.value(CTextureSize));
        reflector.getRenderTarget().setSize(textureSize, textureSize);
    }
}
