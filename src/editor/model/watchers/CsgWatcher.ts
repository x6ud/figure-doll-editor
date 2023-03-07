import Class from '../../../common/type/Class';
import CAngleRange from '../components/CAngleRange';
import CEndRadius2 from '../components/CEndRadius2';
import CGeom3 from '../components/CGeom3';
import CHeight from '../components/CHeight';
import CInnerRadius from '../components/CInnerRadius';
import CInnerRotation from '../components/CInnerRotation';
import CInnerSegments from '../components/CInnerSegments';
import CNumOfSlices from '../components/CNumOfSlices';
import COuterRadius from '../components/COuterRadius';
import COuterRotation from '../components/COuterRotation';
import COuterSegments from '../components/COuterSegments';
import CPosition from '../components/CPosition';
import CRadius from '../components/CRadius';
import CRadius3 from '../components/CRadius3';
import CRotation from '../components/CRotation';
import CRoundRadius from '../components/CRoundRadius';
import CScale from '../components/CScale';
import CScale3 from '../components/CScale3';
import CSegments from '../components/CSegments';
import CSign from '../components/CSign';
import CSize3 from '../components/CSize3';
import CSliceAngleEnd from '../components/CSliceAngleEnd';
import CSliceAngleStart from '../components/CSliceAngleStart';
import CSliceInnerRadius from '../components/CSliceInnerRadius';
import CSlicePreventTwisting from '../components/CSlicePreventTwisting';
import CSliceShape from '../components/CSliceShape';
import CSliceSize2End from '../components/CSliceSize2End';
import CSliceSize2Start from '../components/CSliceSize2Start';
import CStartRadius2 from '../components/CStartRadius2';
import CStarVertices from '../components/CStarVertices';
import CVisible from '../components/CVisible';
import Model from '../Model';
import ModelNode from '../ModelNode';
import ModelNodeChangedWatcher from '../ModelNodeChangedWatcher';
import ModelNodeComponent from '../ModelNodeComponent';

const watch: { [name: string]: Class<ModelNodeComponent<any>>[] } = {
    'CsgCuboid': [CSize3, CRoundRadius, CSegments],
    'CsgEllipsoid': [CRadius3, CSegments],
    'CsgCylinder': [CHeight, CRadius, CRoundRadius, CSegments],
    'CsgCylinderElliptic': [CHeight, CStartRadius2, CEndRadius2, CAngleRange, CSegments],
    'CsgRoundedCuboid': [CSize3, CRoundRadius, CSegments],
    'CsgRoundedCylinder': [CHeight, CRadius, CRoundRadius, CSegments],
    'CsgTorus': [CInnerRadius, COuterRadius, CInnerSegments, COuterSegments, CInnerRotation, COuterRotation],
    'CsgBezier': [
        CSliceShape,
        CSliceSize2Start,
        CSliceSize2End,
        CStarVertices,
        CSliceInnerRadius,
        CSliceAngleStart,
        CSliceAngleEnd,
        CNumOfSlices,
        CSegments,
        CSlicePreventTwisting,
    ],
    'CsgBezierControlPoint': [CPosition],
};

export default class CsgWatcher implements ModelNodeChangedWatcher {
    onValueChanged(model: Model, node: ModelNode, componentClass: Class<ModelNodeComponent<any>>): void {
        if (!node.has(CGeom3)) {
            return;
        }
        if ([CPosition, CRotation, CScale, CScale3].includes(componentClass)) {
            const cGeom3 = node.get(CGeom3);
            cGeom3.matDirty = true;
            this.markCsgNodeDirty(node.parent);
            return;
        }
        if ([CVisible, CSign].includes(componentClass)) {
            this.markCsgNodeDirty(node.parent);
            return;
        }
        if (watch[node.type]?.includes(componentClass)) {
            this.markCsgNodeDirty(node);
        }
    }

    onChildAdded(model: Model, node: ModelNode, child: ModelNode): void {
        this.markCsgNodeDirty(node);
    }

    onBeforeChildRemoved(model: Model, node: ModelNode, child: ModelNode): void {
        this.markCsgNodeDirty(node);
    }

    onMoved(model: Model, node: ModelNode, oldParent: ModelNode | null, newParent: ModelNode | null): void {
        this.markCsgNodeDirty(oldParent);
        this.markCsgNodeDirty(newParent);
    }

    private markCsgNodeDirty(node: ModelNode | null) {
        while (node) {
            if (node.has(CGeom3)) {
                node.dirty = true;
                const cGeom3 = node.get(CGeom3);
                cGeom3.dirty = true;
                node = node.parent;
            } else {
                break;
            }
        }
    }
}
