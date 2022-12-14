import {BufferGeometry, Float32BufferAttribute, Mesh, MeshStandardMaterial} from 'three';
import EditorContext from '../../EditorContext';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import CSdfDirty from '../../model/components/CSdfDirty';
import CSdfOperator from '../../model/components/CSdfOperator';
import CSdfSymmetry from '../../model/components/CSdfSymmetry';
import CTube from '../../model/components/CTube';
import ModelNode from '../../model/ModelNode';
import SdfMeshBuilder from '../../utils/geometry/SdfMeshBuilder';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class CustomShapeUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.type !== 'Shape') {
            return;
        }
        if (!node.value(CSdfDirty)) {
            return;
        }
        const cSdfDirty = node.get(CSdfDirty);
        cSdfDirty.value = false;
        const cObject3D = node.get(CObject3D);
        if (!cObject3D.value) {
            cObject3D.value = new Mesh(
                new BufferGeometry(),
                new MeshStandardMaterial()
            );
            (cObject3D.value.userData as Object3DUserData) = {node};
        }
        cSdfDirty.throttleHash = `#${node.id}-update-custom-shape-geometry`;
        ctx.throttle(
            cSdfDirty.throttleHash,
            25,
            function () {
                if (node.deleted) {
                    return;
                }
                cSdfDirty.throttleHash = '';
                const builder = new SdfMeshBuilder();
                switch (node.value(CSdfSymmetry)) {
                    case 'x':
                        builder.symmetryAxis = 0;
                        break;
                    case 'y':
                        builder.symmetryAxis = 1;
                        break;
                    case 'z':
                        builder.symmetryAxis = 2;
                        break;
                }
                for (let child of node.children) {
                    const tube = child.value(CTube);
                    const operator = child.value(CSdfOperator) === 'add';
                    if (tube.length === 1) {
                        builder.sphere(tube[0].position, tube[0].radius, operator);
                    } else {
                        for (let i = 0; i + 1 < tube.length; ++i) {
                            const n1 = tube[i];
                            const n2 = tube[i + 1];
                            builder.roundCone(n1.position, n1.radius, n2.position, n2.radius, operator);
                        }
                    }
                }
                const {position, normal} = builder.build();
                const mesh = cObject3D.value as Mesh;
                const geometry = mesh.geometry;
                geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
                geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3));
                geometry.computeBoundingSphere();
            },
            false
        );
    }
}
