import {BufferGeometry, Group, Line, LineBasicMaterial, Mesh, Object3D, Vector3} from 'three';
import {ParametricGeometries} from 'three/examples/jsm/geometries/ParametricGeometries';
import EditorContext from '../../EditorContext';
import CObject3D, {Object3DUserData} from '../../model/components/CObject3D';
import CTube, {TubeNodePickerUserData} from '../../model/components/CTube';
import ModelNode from '../../model/ModelNode';
import CircleEdgeGeometry from '../../utils/geometry/CircleEdgeGeometry';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';
import SphereGeometry = ParametricGeometries.SphereGeometry;

const pickerGeometry = new SphereGeometry(1, 20, 20);
const circleGeometry = new CircleEdgeGeometry();
const lineGeometry = new BufferGeometry().setFromPoints([new Vector3(), new Vector3(1, 0, 0)]);

const _unitX = new Vector3(1, 0, 0);
const _det = new Vector3();

export default class TubeUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (!node.has(CTube)) {
            return;
        }
        const cTube = node.get(CTube);
        if (!cTube.dirty) {
            return;
        }
        cTube.dirty = false;
        if (!cTube.group) {
            cTube.group = new Group();
            cTube.group.visible = false;
            ctx.scene.add(cTube.group);
        }
        const tube = cTube.value;
        while (tube.length < cTube.pickers.length) {
            const obj = cTube.pickers.pop();
            obj?.removeFromParent();
        }
        while (tube.length < cTube.circles.length) {
            const obj = cTube.circles.pop();
            obj?.removeFromParent();
        }
        while (cTube.lines.length && tube.length - 1 < cTube.lines.length) {
            const obj = cTube.lines.pop();
            obj?.removeFromParent();
        }
        while (tube.length > cTube.pickers.length) {
            const obj = new Mesh(pickerGeometry);
            obj.visible = false;
            const len = cTube.pickers.push(obj);
            (obj.userData as TubeNodePickerUserData) = {index: len - 1};
            cTube.group.add(obj);
        }
        while (tube.length > cTube.circles.length) {
            const obj = new Line(circleGeometry, CTube.normalMaterial);
            cTube.circles.push(obj);
            cTube.group.add(obj);
        }
        while (tube.length - 1 > cTube.lines.length) {
            const line = new Line(lineGeometry, CTube.normalMaterial);
            cTube.lines.push(line);
            cTube.group.add(line);
        }
        for (let i = 0, len = tube.length; i < len; ++i) {
            const node = tube[i];
            const circle = cTube.circles[i];
            circle.position.copy(node.position);
            circle.scale.setScalar(node.radius);
            const picker = cTube.pickers[i];
            picker.position.copy(node.position);
            picker.scale.setScalar(node.radius);
            if (i < len - 1) {
                const line = cTube.lines[i];
                line.position.copy(node.position);
                _det.subVectors(tube[i + 1].position, node.position);
                const len = _det.length();
                line.scale.setScalar(len);
                if (len > 1e-8) {
                    line.quaternion.setFromUnitVectors(_unitX, _det.divideScalar(len));
                }
            }
        }

        ctx.nextFrameEnd(function () {
            if (node.deleted) {
                return;
            }
            const cObject3D = node.get(CObject3D);
            if (!cObject3D.value) {
                // todo
                cObject3D.value = new Object3D();
            }
            (cObject3D.value.userData as Object3DUserData) = {node};
            ctx.model.dirty = true;
            node.dirty = true;
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
        });
    }
}
