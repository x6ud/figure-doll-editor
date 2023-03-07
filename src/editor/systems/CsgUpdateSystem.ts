import beizer from '@jscad/modeling/src/curves/bezier';
import {Geom2} from '@jscad/modeling/src/geometries/geom2';
import {Geom3} from '@jscad/modeling/src/geometries/geom3';
import {EPS} from '@jscad/modeling/src/maths/constants';
import {Mat4} from '@jscad/modeling/src/maths/mat4';
import {intersect, subtract, union} from '@jscad/modeling/src/operations/booleans';
import {extrudeFromSlices, slice} from '@jscad/modeling/src/operations/extrusions';
import {hull, hullChain} from '@jscad/modeling/src/operations/hulls';
import {
    cuboid,
    cylinder,
    cylinderElliptic,
    ellipse,
    rectangle,
    roundedCuboid,
    roundedCylinder,
    star,
    torus
} from '@jscad/modeling/src/primitives';
import ellipsoid from '@jscad/modeling/src/primitives/ellipsoid';
import {
    BufferGeometry,
    Group,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    NearestFilter,
    Points,
    PointsMaterial,
    Quaternion,
    TextureLoader,
    Vector3
} from 'three';
import {ParametricGeometries} from 'three/examples/jsm/geometries/ParametricGeometries';
import EditorContext from '../EditorContext';
import CAngleRange from '../model/components/CAngleRange';
import CEndRadius2 from '../model/components/CEndRadius2';
import CGeom3 from '../model/components/CGeom3';
import CHeight from '../model/components/CHeight';
import CInnerRadius from '../model/components/CInnerRadius';
import CInnerRotation from '../model/components/CInnerRotation';
import CInnerSegments from '../model/components/CInnerSegments';
import CNumOfSlices from '../model/components/CNumOfSlices';
import CObject3D from '../model/components/CObject3D';
import COuterRadius from '../model/components/COuterRadius';
import COuterRotation from '../model/components/COuterRotation';
import COuterSegments from '../model/components/COuterSegments';
import CPosition from '../model/components/CPosition';
import CRadius from '../model/components/CRadius';
import CRadius3 from '../model/components/CRadius3';
import CRotation from '../model/components/CRotation';
import CRoundRadius from '../model/components/CRoundRadius';
import CScale from '../model/components/CScale';
import CScale3 from '../model/components/CScale3';
import CSegments from '../model/components/CSegments';
import CSign from '../model/components/CSign';
import CSize3 from '../model/components/CSize3';
import CSliceAngleEnd from '../model/components/CSliceAngleEnd';
import CSliceAngleStart from '../model/components/CSliceAngleStart';
import CSliceInnerRadius from '../model/components/CSliceInnerRadius';
import CSlicePreventTwisting from '../model/components/CSlicePreventTwisting';
import CSliceShape from '../model/components/CSliceShape';
import CSliceSize2End from '../model/components/CSliceSize2End';
import CSliceSize2Start from '../model/components/CSliceSize2Start';
import CStartRadius2 from '../model/components/CStartRadius2';
import CStarVertices from '../model/components/CStarVertices';
import CVisible from '../model/components/CVisible';
import Model from '../model/Model';
import ModelNode from '../model/ModelNode';
import {geom3ToBufferGeometry} from '../utils/geometry/jscad';
import UpdateSystem from '../utils/UpdateSystem';
import bezierControlPoint from './bezier-control-point.png';
import SphereGeometry = ParametricGeometries.SphereGeometry;

const _translation = new Vector3();
const _rotation = new Quaternion();
const _scale = new Vector3();
const _base = new Vector3(0, 0, 1);
const _dir = new Vector3();
const _twist = new Quaternion();
const _mat = new Matrix4();
const _matArr = new Array(16).fill(0) as Mat4;

const placeholderMaterial = new MeshStandardMaterial({
    toneMapped: false,
    color: 0xE6A23C,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
});
const transparentMaterial = new MeshStandardMaterial({
    toneMapped: false,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
});
const texLoader = new TextureLoader();
const texBezierControlPoint = texLoader.load(bezierControlPoint);
texBezierControlPoint.minFilter = texBezierControlPoint.magFilter = NearestFilter;
const bezierControlPointMaterial = new PointsMaterial({
    map: texBezierControlPoint,
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    size: 24,
});

export default class CsgUpdateSystem extends UpdateSystem<EditorContext> {
    begin(ctx: EditorContext) {
        const model = ctx.readonlyRef().model;
        if (!model.dirty) {
            return;
        }
        const stack: ModelNode[] = [...model.nodes];
        while (stack.length) {
            const node = stack.pop();
            if (!node) {
                break;
            }
            if (node.has(CGeom3)) {
                this.updateMatrix(node);
                if (!node.instanceId) {
                    ctx.throttle(`#${node.id}-update-csg`,
                        50,
                        () => {
                            this.updateGeometry(model, node);
                        },
                        false
                    );
                }
            } else {
                stack.push(...node.children);
            }
        }
    }

    private updateMatrix(node: ModelNode) {
        if (!node.has(CGeom3)) {
            return;
        }
        const cGeom3 = node.get(CGeom3);
        if (cGeom3.dirty) {
            for (let child of node.children) {
                this.updateMatrix(child);
            }
        }
        if (cGeom3.matDirty) {
            cGeom3.matDirty = false;
            if (node.has(CPosition)) {
                _translation.copy(node.value(CPosition));
            } else {
                _translation.set(0, 0, 0);
            }
            if (node.has(CRotation)) {
                _rotation.setFromEuler(node.value(CRotation));
            } else {
                _rotation.set(0, 0, 0, 1);
            }
            if (node.has(CScale3)) {
                _scale.copy(node.value(CScale3));
            } else if (node.has(CScale)) {
                _scale.setScalar(node.value(CScale));
            } else {
                _scale.setScalar(1);
            }
            cGeom3.matrix.compose(_translation, _rotation, _scale);
            if (!cGeom3.dirty && cGeom3.value) {
                cGeom3.matrix.toArray(cGeom3.value.transforms = [...cGeom3.value.transforms]);
            }
        }
    }

    private updateGeometry(model: Model, node: ModelNode) {
        if (!node.has(CGeom3)) {
            return;
        }
        const cGeom3 = node.get(CGeom3);
        if (cGeom3.dirty) {
            cGeom3.dirty = false;
            for (let child of node.children) {
                this.updateGeometry(model, child);
            }
            // rebuild geom3
            switch (node.type) {
                case 'CsgGroup': {
                    let merged: Geom3 | null = null;
                    let currSign = true;
                    let group: Geom3[] = [];
                    for (let child of node.children) {
                        if (!child.value(CVisible)) {
                            continue;
                        }
                        if (child.instanceId) {
                            child = model.getNode(child.instanceId);
                        }
                        let geom3 = child.value(CGeom3);
                        if (!geom3) {
                            continue;
                        }
                        geom3 = Object.assign({}, geom3);
                        const sign = child.value(CSign) === 'positive';
                        if (currSign === sign) {
                            group.push(geom3);
                        } else {
                            if (currSign) {
                                if (merged) {
                                    group = [merged, ...group];
                                }
                                if (group.length) {
                                    merged = union(...group);
                                }
                            } else if (merged) {
                                merged = subtract(merged, ...group);
                            }
                            group = [geom3];
                            currSign = sign;
                        }
                    }
                    if (group.length) {
                        if (currSign) {
                            if (merged) {
                                group = [merged, ...group];
                            }
                            merged = union(...group);
                        } else if (merged) {
                            merged = subtract(merged, ...group);
                        }
                    }
                    cGeom3.value = merged;
                }
                    break;
                case 'CsgIntersect': {
                    const group: Geom3[] = [];
                    for (let child of node.children) {
                        if (!child.value(CVisible)) {
                            continue;
                        }
                        if (child.instanceId) {
                            child = model.getNode(child.instanceId);
                        }
                        const geom3 = child.value(CGeom3);
                        if (!geom3) {
                            continue;
                        }
                        group.push(Object.assign({}, geom3));
                    }
                    if (group.length) {
                        cGeom3.value = group.length > 1 ? intersect(...group) : union(group[0]);
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgHull': {
                    const group: Geom3[] = [];
                    for (let child of node.children) {
                        if (!child.value(CVisible)) {
                            continue;
                        }
                        if (child.instanceId) {
                            child = model.getNode(child.instanceId);
                        }
                        const geom3 = child.value(CGeom3);
                        if (!geom3) {
                            continue;
                        }
                        group.push(Object.assign({}, geom3));
                    }
                    if (group.length) {
                        cGeom3.value = group.length > 1 ? hull(...group) : union(group[0]);
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgHullChain': {
                    const group: Geom3[] = [];
                    for (let child of node.children) {
                        if (!child.value(CVisible)) {
                            continue;
                        }
                        if (child.instanceId) {
                            child = model.getNode(child.instanceId);
                        }
                        const geom3 = child.value(CGeom3);
                        if (!geom3) {
                            continue;
                        }
                        group.push(Object.assign({}, geom3));
                    }
                    if (group.length) {
                        cGeom3.value = group.length > 1 ? hullChain(...group) : union(group[0]);
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgEllipsoid': {
                    const radius3 = node.value(CRadius3);
                    const segments = Math.max(4, node.value(CSegments));
                    if (radius3.x > 0 && radius3.y > 0 && radius3.z > 0) {
                        cGeom3.value = ellipsoid({
                            radius: [radius3.x, radius3.y, radius3.z],
                            segments,
                        });
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgCuboid': {
                    const size3 = node.value(CSize3);
                    const roundRadius = Math.min(node.value(CRoundRadius), size3.x / 2 - 1e-5, size3.y / 2 - 1e-5, size3.z / 2 - 1e-5);
                    const segments = Math.max(4, node.value(CSegments));
                    if (size3.x > 0 && size3.y > 0 && size3.z > 0) {
                        if (roundRadius > 0) {
                            cGeom3.value = roundedCuboid({
                                size: [size3.x, size3.y, size3.z],
                                roundRadius,
                                segments
                            });
                        } else {
                            cGeom3.value = cuboid({
                                size: [size3.x, size3.y, size3.z]
                            });
                        }
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgCylinder': {
                    const height = node.value(CHeight);
                    const radius = node.value(CRadius);
                    const roundRadius = Math.min(node.value(CRoundRadius), radius - 1e-5, height / 2 - 1e-5);
                    const segments = Math.max(4, node.value(CSegments));
                    if (height > 0 && radius > 0) {
                        if (roundRadius > 0) {
                            cGeom3.value = roundedCylinder({
                                height,
                                radius,
                                roundRadius,
                                segments
                            });
                        } else {
                            cGeom3.value = cylinder({height, radius});
                        }
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgCylinderElliptic': {
                    const height = node.value(CHeight);
                    const startRadius = node.value(CStartRadius2);
                    const endRadius = node.value(CEndRadius2);
                    const segments = Math.max(4, node.value(CSegments));
                    const angleRange = node.value(CAngleRange);
                    if (height > 0
                        && (startRadius.x > 0 || startRadius.y > 0 || endRadius.x > 0 || endRadius.y > 0)
                        && angleRange[1] > angleRange[0]
                    ) {
                        cGeom3.value = cylinderElliptic({
                            height,
                            startRadius: [startRadius.x, startRadius.y],
                            endRadius: [endRadius.x, endRadius.y],
                            segments,
                            startAngle: angleRange[0] / 180 * Math.PI,
                            endAngle: angleRange[1] / 180 * Math.PI
                        });
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgTorus': {
                    const innerRadius = node.value(CInnerRadius);
                    const outerRadius = node.value(COuterRadius);
                    const innerSegments = Math.max(3, node.value(CInnerSegments));
                    const outerSegments = Math.max(3, node.value(COuterSegments));
                    const innerRotation = node.value(CInnerRotation) / 180 * Math.PI;
                    const outerRotation = node.value(COuterRotation) / 180 * Math.PI;
                    if (innerRadius > 0
                        && outerRadius > 0
                        && outerRadius > innerRadius
                        && outerRotation > 0
                    ) {
                        cGeom3.value = torus({
                            innerRadius,
                            outerRadius,
                            innerSegments,
                            outerSegments,
                            innerRotation,
                            outerRotation
                        });
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgBezier': {
                    const shape = node.value(CSliceShape);
                    const sizeStart = node.value(CSliceSize2Start);
                    const sizeEnd = node.value(CSliceSize2End);
                    const innerRadius = node.value(CSliceInnerRadius);
                    const starVertices = Math.max(3, node.value(CStarVertices));
                    const angleStart = node.value(CSliceAngleStart) / 180 * Math.PI;
                    const angleEnd = node.value(CSliceAngleEnd) / 180 * Math.PI;
                    const segments = Math.max(3, node.value(CSegments));
                    const numOfSlices = Math.max(2, node.value(CNumOfSlices));
                    if (sizeStart.x >= 0
                        && sizeStart.y >= 0
                        && sizeEnd.x >= 0
                        && sizeEnd.y >= 0
                        && (sizeStart.x || sizeStart.y || sizeEnd.x || sizeEnd.y)
                        && !(shape === 'star' && innerRadius === 0)
                        && node.children.length > 1) {
                        const points: number[][] = [];
                        for (let child of node.children) {
                            points.push(child.value(CPosition).toArray([0, 0, 0]));
                        }
                        let geom2: Geom2;
                        switch (shape) {
                            case 'ellipse':
                                geom2 = ellipse({
                                    radius: [Math.max(EPS, sizeStart.x), Math.max(EPS, sizeStart.y)],
                                    segments
                                });
                                break;
                            case 'rectangle':
                                geom2 = rectangle({size: [Math.max(EPS, sizeStart.x), Math.max(EPS, sizeStart.y)]});
                                break;
                            case 'star':
                                geom2 = star({
                                    outerRadius: Math.max(EPS, sizeStart.x),
                                    innerRadius: Math.max(EPS, sizeStart.x * innerRadius),
                                    vertices: starVertices
                                });
                                break;
                            default:
                                throw new Error(`Unknown shape ${shape}`);
                        }
                        const curve = beizer.create(points);
                        let base = slice.fromSides(geom2.sides);
                        if (node.value(CSlicePreventTwisting)) {
                            _dir.set(points[1][0] - points[0][0],
                                points[1][1] - points[0][1],
                                points[1][2] - points[0][2]
                            )
                                .normalize();
                            if (_dir.lengthSq() < .5) {
                                _dir.set(0, 0, 1);
                            }
                            _base.set(0, 0, 1);
                            _translation.set(0, 0, 0);
                            _rotation.setFromUnitVectors(_base, _dir);
                            _scale.set(1, 1, 1);
                            _mat.compose(_translation, _rotation, _scale);
                            _mat.toArray(_matArr);
                            base = slice.transform(_matArr, base);
                            _base.copy(_dir);
                        } else {
                            _base.set(0, 0, 1);
                        }
                        cGeom3.value = extrudeFromSlices(
                            {
                                numberOfSlices: numOfSlices,
                                capStart: true,
                                capEnd: true,
                                callback: (progress, index, base) => {
                                    const position = beizer.valueAt(progress, curve) as number[];
                                    const tangent = beizer.tangentAt(progress, curve) as number[];
                                    _translation.fromArray(position);
                                    _dir.fromArray(tangent).normalize();
                                    _rotation.setFromUnitVectors(_base, _dir);
                                    const angle = (angleStart - angleEnd) * progress + angleStart;
                                    _twist.setFromAxisAngle(_base, angle);
                                    _rotation.multiplyQuaternions(_rotation, _twist);
                                    let sx = (sizeEnd.x - sizeStart.x) * progress + sizeStart.x;
                                    let sy = (sizeEnd.y - sizeStart.y) * progress + sizeStart.y;
                                    sx = sx / Math.max(sizeStart.x, EPS);
                                    sy = sy / Math.max(sizeStart.y, EPS);
                                    if (shape === 'star') {
                                        sy *= sizeStart.y / Math.max(EPS, sizeStart.x);
                                    }
                                    _scale.set(Math.max(EPS, sx), Math.max(EPS, sy), 1);
                                    _mat.compose(_translation, _rotation, _scale);
                                    _mat.toArray(_matArr);
                                    return slice.transform(_matArr, base);
                                }
                            },
                            base
                        );
                    } else {
                        cGeom3.value = null;
                    }
                }
                    break;
                case 'CsgBezierControlPoint': {
                    cGeom3.value = null;
                }
                    break;
                default:
                    throw new Error(`Unknown csg node type [${node.type}]`);
            }
            // rebuild geometry
            const cObject3D = node.get(CObject3D);
            if (node.type === 'CsgBezierControlPoint') {
                if (!cObject3D.value) {
                    cObject3D.value = new Mesh(new SphereGeometry(1e-3, 8, 8), transparentMaterial);
                    cObject3D.value.visible = false;
                }
                cGeom3.placeholder = new Points(
                    new BufferGeometry().setFromPoints([new Vector3()]),
                    bezierControlPointMaterial
                );
                cGeom3.placeholder.renderOrder = 2;
            } else {
                const geometry = cGeom3.value ? geom3ToBufferGeometry(cGeom3.value) : new BufferGeometry();
                if (cObject3D.value) {
                    const mesh = cObject3D.value.children[0] as Mesh;
                    mesh.geometry.dispose();
                    mesh.geometry = geometry;
                    geometry.computeBoundingSphere();
                } else {
                    const group = cObject3D.value = new Group();
                    group.userData.node = node;
                    const mesh = new Mesh(geometry, new MeshStandardMaterial());
                    mesh.userData.node = node;
                    group.add(mesh);
                }
                if (cGeom3.placeholder) {
                    cGeom3.placeholder.removeFromParent();
                    delete cGeom3.placeholder;
                }
                if (geometry) {
                    cGeom3.placeholder = new Mesh(geometry, placeholderMaterial);
                }
                model.instanceMeshUpdated(node.id, true);
            }
            // copy matrix
            if (cGeom3.value) {
                cGeom3.matrix.toArray(cGeom3.value.transforms = [...cGeom3.value.transforms]);
            }
            // object3d changed
            cGeom3.useTempMat = false;
            model.dirty = true;
            node.dirty = true;
            cObject3D.parentChanged = true;
            cObject3D.localTransformChanged = true;
            cObject3D.worldTransformChanged = true;
        }
    }

    end(ctx: EditorContext): void {
    }
}
