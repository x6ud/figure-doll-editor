import {BufferGeometry, Line, LineBasicMaterial, Matrix4, Quaternion, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import {Object3DUserData} from '../model/components/CObject3D';
import CTube, {Tube, TubeNodePickerUserData} from '../model/components/CTube';
import ModelNode from '../model/ModelNode';
import CircleEdgeGeometry from '../utils/geometry/CircleEdgeGeometry';
import {getRotation, getScaleScalar, intersectPointRect, linePanelIntersection, snapPoint} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './Tube.png';

const _pos = new Vector3();
const _mouse1 = new Vector3();
const _det = new Vector3();
const _rot = new Quaternion();
const _unitX = new Vector3(1, 0, 0);
const _mat = new Matrix4();

const MIN_RADIUS = 0.003;
const RESIZE_STEP = 0.003;
const MAX_RADIUS = 5;
const SNAP_STEP = 0.05;

export default class TubeTool extends EditorTool {
    label = 'Tube';
    icon = icon;
    tips = 'Hold [Alt] to create/insert a tube node. Resize tube node with mouse wheel.';
    enableDefaultDeleteShortcut = false;
    enableSelectionRect = true;
    enableDefaultSelectionBehavior = false;

    /** Selected nodes with CTube component */
    private nodes: ModelNode[] = [];
    private enableDeleteThisFrame = true;

    private dragging = false;
    private draggingActiveViewIndex = -1;
    private mouse0 = new Vector3();

    /** Indicator for creating node */
    private circle = new Line(
        new CircleEdgeGeometry(),
        new LineBasicMaterial({
            depthTest: false,
            depthWrite: false,
            fog: false,
            toneMapped: false,
            transparent: true,
            color: 0xff00ff
        })
    );
    /** Indicator for creating node */
    private line1 = new Line(
        new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(1, 0, 0)]),
        this.circle.material.clone()
    );
    /** Indicator for creating node */
    private line2 = new Line(
        this.line1.geometry.clone(),
        this.line1.material.clone()
    );
    private creating = false;
    /** Creating node radius */
    private radius = 0.1;
    /** New node id that created in previous frame */
    private lastNodeId = 0;

    setup(ctx: EditorContext) {
        this.circle.visible = false;
        ctx.scene.add(this.circle);
        this.line1.visible = false;
        ctx.scene.add(this.line1);
        this.line2.visible = false;
        ctx.scene.add(this.line2);
    }

    begin(ctx: EditorContext) {
        ctx = ctx.readonlyRef();
        for (let node of this.nodes) {
            if (node.deleted) {
                continue;
            }
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = false;
            }
            if (ctx.model.selected.includes(node.id)) {
                cTube.selected = cTube.selected.filter(i => i < cTube.value.length);
            } else {
                cTube.selected.length = 0;
            }
        }
        this.enableDefaultDeleteShortcut = true;
        this.enableDeleteThisFrame = true;
        this.nodes = ctx.model.getSelectedNodes().filter(node => node.has(CTube) && !node.instanceId);
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = true;
            }
            cTube.hovered = -1;
            if (cTube.selected.length) {
                this.enableDefaultDeleteShortcut = false;
            }
            if (node.id === this.lastNodeId && cTube.value.length) {
                cTube.selected = [0];
                this.lastNodeId = 0;
            }
        }
        this.enableSelectionRect = true;
        if (!this.creating) {
            this.circle.visible = false;
            this.line1.visible = false;
            this.line2.visible = false;
            this.lastNodeId = 0;
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;
        // delete selected tube nodes
        if (input.isKeyPressed('Delete') && this.enableDeleteThisFrame) {
            this.enableDeleteThisFrame = false;
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                if (cTube.selected.length) {
                    const tube = cTube.clone().filter((_, i) => !cTube.selected.includes(i));
                    cTube.selected.length = 0;
                    if (tube.length === 0) {
                        ctx.history.removeNode(node.id);
                    } else {
                        ctx.history.setValue(node, CTube, tube);
                    }
                }
            }
            return;
        }
        // drag move
        if (this.dragging && view.index === this.draggingActiveViewIndex) {
            this.enableSelectionRect = false;
            if (input.mouseLeft) {
                if (linePanelIntersection(
                    _mouse1,
                    view.mouseRay0, view.mouseRay1,
                    this.mouse0, view.mouseRayN
                )) {
                    _det.subVectors(_mouse1, this.mouse0);
                    let draggingSelected = true;
                    for (let node of this.nodes) {
                        const cTube = node.get(CTube);
                        if (cTube.draggingStartNodeIndex >= 0) {
                            draggingSelected = cTube.selected.includes(cTube.draggingStartNodeIndex);
                            break;
                        }
                    }
                    for (let node of this.nodes) {
                        const cTube = node.get(CTube);
                        if (cTube.selected.length || cTube.draggingStartNodeIndex >= 0) {
                            const val = cTube.clone(cTube.draggingStartValue!);
                            if (draggingSelected) {
                                for (let index of cTube.selected) {
                                    val[index].position
                                        .applyMatrix4(cTube.draggingStartMatrix!)
                                        .add(_det)
                                        .applyMatrix4(cTube.draggingStartInvMatrix!);
                                    if (input.isKeyPressed('Shift')) {
                                        snapPoint(val[index].position, SNAP_STEP);
                                    }
                                }
                            }
                            if (cTube.draggingStartNodeIndex >= 0 && !draggingSelected) {
                                val[cTube.draggingStartNodeIndex].position
                                    .applyMatrix4(cTube.draggingStartMatrix!)
                                    .add(_det)
                                    .applyMatrix4(cTube.draggingStartInvMatrix!);
                                if (input.isKeyPressed('Shift')) {
                                    snapPoint(val[cTube.draggingStartNodeIndex].position, SNAP_STEP);
                                }
                            }
                            ctx.history.setValue(node, CTube, val);
                        }
                    }
                    if (!draggingSelected) {
                        for (let node of this.nodes) {
                            const cTube = node.get(CTube);
                            if (cTube.draggingStartNodeIndex >= 0) {
                                cTube.selected = [cTube.draggingStartNodeIndex];
                            } else {
                                cTube.selected = [];
                            }
                        }
                    }
                }
            } else {
                // drag end
                this.dragging = false;
                this.draggingActiveViewIndex = -1;
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    cTube.draggingStartNodeIndex = -1;
                }
            }
        }
        // find hovered
        if (input.pointerOver && !(this.dragging || this.creating)) {
            let resize = false;
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                const result = view.raycaster.intersectObjects(cTube.pickers);
                if (result.length) {
                    // found
                    const index = (result[0].object.userData as TubeNodePickerUserData).index;
                    cTube.hovered = index == null ? -1 : index;

                    if (input.mouseLeftDownThisFrame) {
                        // drag start
                        this.dragging = true;
                        this.draggingActiveViewIndex = view.index;
                        this.mouse0.copy(result[0].point);
                        cTube.draggingStartNodeIndex = cTube.hovered;
                    } else if (input.wheelDetY) {
                        // wheel resize radius
                        for (let item of result) {
                            const index = (item.object.userData as TubeNodePickerUserData).index;
                            if (index != null && cTube.selected.includes(index)) {
                                resize = true;
                                break;
                            }
                        }
                    }
                } else {
                    cTube.hovered = -1;
                }
            }
            // save dragging start state
            if (this.dragging && view.index === this.draggingActiveViewIndex) {
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (cTube.selected.length || cTube.draggingStartNodeIndex >= 0) {
                        cTube.draggingStartMatrix = new Matrix4().copy(node.getWorldMatrix());
                        cTube.draggingStartInvMatrix = new Matrix4().copy(node.getWorldMatrix()).invert();
                        cTube.draggingStartValue = cTube.clone();
                    }
                }
            }
            // wheel resize radius
            if (resize) {
                ctx.disableCameraDraggingThisFrame = true;
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (cTube.selected.length) {
                        const value = cTube.clone();
                        for (let i of cTube.selected) {
                            value[i].radius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, value[i].radius - input.wheelDetY * RESIZE_STEP));
                        }
                        ctx.history.setValue(node, CTube, value);
                    }
                }
            }
            // start creating node
            if (!this.dragging && !this.creating && input.isKeyPressed('Alt')) {
                this.creating = true;
                // set new node radius as current selected node
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (cTube.selected.length) {
                        this.radius = cTube.value[cTube.selected[0]].radius;
                        this.radius *= getScaleScalar(node.getWorldMatrix());
                        break;
                    }
                }
            }
        }
        // creating node
        if (this.creating) {
            if (input.isKeyPressed('Alt')) {
                this.enableSelectionRect = false;
                if (input.pointerOver) {
                    // find insert position
                    let node: ModelNode | null = null;
                    let cTube: CTube | null = null;
                    let index = -1;
                    for (let node_ of this.nodes) {
                        const cTube_ = node_.get(CTube);
                        if (cTube_.selected.length) {
                            node = node_;
                            cTube = cTube_;
                            index = cTube_.selected[0];
                            break;
                        }
                    }
                    if (node) {
                        _pos.copy(cTube!.value[index].position)
                            .applyMatrix4(node.getWorldMatrix());
                    } else {
                        for (let node of ctx.readonlyRef().model.getSelectedNodes()) {
                            if (node.isValidChild('Tube')) {
                                _pos.setFromMatrixPosition(node.getWorldMatrix());
                                break;
                            }
                        }
                    }
                    // get mouse pointing position
                    linePanelIntersection(
                        this.circle.position,
                        view.mouseRay0, view.mouseRay1,
                        _pos, view.mouseRayN
                    );
                    if (input.isKeyPressed('Shift')) {
                        snapPoint(this.circle.position, SNAP_STEP);
                    }
                    // wheel resize radius
                    if (input.wheelDetY) {
                        this.radius = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, -input.wheelDetY * RESIZE_STEP + this.radius));
                        ctx.disableCameraDraggingThisFrame = true;
                    }
                    // update indicator position
                    this.circle.scale.setScalar(this.radius);
                    this.circle.visible = true;
                    this.line1.visible = false;
                    this.line2.visible = false;
                    if (node) {
                        this.line1.position.copy(cTube!.value[index].position)
                            .applyMatrix4(node.getWorldMatrix());
                        _det.subVectors(this.circle.position, this.line1.position);
                        this.line1.scale.setScalar(_det.length());
                        this.line1.quaternion.setFromUnitVectors(_unitX, _det.normalize());
                        this.line1.visible = true;
                        if (index < cTube!.value.length - 1) {
                            this.line2.position.copy(cTube!.value[index + 1].position)
                                .applyMatrix4(node.getWorldMatrix());
                            _det.subVectors(this.circle.position, this.line2.position);
                            this.line2.scale.setScalar(_det.length());
                            this.line2.quaternion.setFromUnitVectors(_unitX, _det.normalize());
                            this.line2.visible = true;
                            cTube!.lines[index].visible = false;
                            ctx.nextFrameEnd(() => {
                                const line = cTube?.lines[index];
                                if (line) {
                                    line.visible = true;
                                }
                            });
                        }
                    }
                    // left click to create node
                    if (input.mouseLeftDownThisFrame) {
                        _pos.copy(this.circle.position);
                        let radius = this.radius;
                        if (!node && this.nodes.length && this.nodes[0].value(CTube).length === 0) {
                            node = this.nodes[0];
                        }
                        if (node) {
                            // insert tube node
                            _mat.copy(node.getWorldMatrix()).invert();
                            _pos.applyMatrix4(_mat);
                            radius *= getScaleScalar(_mat);
                            let value: Tube;
                            if (cTube) {
                                value = cTube.clone();
                                value.splice(index + 1, 0, {
                                    position: new Vector3().copy(_pos),
                                    radius: radius
                                });
                                cTube.selected = [index + 1];
                            } else {
                                value = [{
                                    position: new Vector3().copy(_pos),
                                    radius: radius
                                }];
                                this.lastNodeId = node.id;
                            }
                            ctx.history.setValue(node, CTube, value);
                        } else {
                            // create a new tube
                            let parent = null;
                            if (this.nodes.length) {
                                parent = this.nodes[0].parent;
                            } else {
                                for (let node of ctx.model.getSelectedNodes()) {
                                    if (node.isValidChild('Tube')) {
                                        parent = node;
                                        break;
                                    }
                                }
                            }
                            if (parent) {
                                _mat.copy(parent.getWorldMatrix()).invert();
                                _pos.applyMatrix4(_mat);
                                radius *= getScaleScalar(_mat);
                            }
                            ctx.model.selected = [];
                            const newShape = !parent;
                            if (newShape) {
                                for (let node of ctx.model.getSelectedNodes()) {
                                    if (node.isValidChild('Shape')) {
                                        parent = node;
                                        break;
                                    }
                                }
                                this.lastNodeId = ctx.history.createNode({
                                    type: 'Shape',
                                    parentId: parent ? parent.id : 0,
                                    data: {},
                                    children: [
                                        {
                                            type: 'Tube',
                                            data: {
                                                [CTube.name]: [{radius, position: new Vector3().copy(_pos)}],
                                            }
                                        }
                                    ]
                                }) + 1;
                            } else {
                                this.lastNodeId = ctx.history.createNode({
                                    type: 'Tube',
                                    parentId: parent ? parent.id : 0,
                                    data: {
                                        [CTube.name]: [{radius, position: new Vector3().copy(_pos)}],
                                    }
                                });
                            }
                        }
                        this.creating = false;
                    }
                }
            } else {
                this.creating = false;
            }
        }
        // select
        if (ctx.selectionRectSetThisFrame
            && ctx.selectionRectViewIndex === view.index
        ) {
            if (ctx.selectionStart.equals(ctx.selectionEnd)) {
                // click select
                let anySelected = false;
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (cTube.selected.length) {
                        anySelected = true;
                    }
                    if (cTube.selected.includes(cTube.hovered)) {
                        if (input.isKeyPressed('Control')) {
                            cTube.selected = cTube.selected.filter(i => i !== cTube.hovered);
                            anySelected = true;
                        }
                    } else {
                        if (!input.isKeyPressed('Control')) {
                            cTube.selected.length = 0;
                        }
                        if (cTube.hovered >= 0) {
                            cTube.addSelection(cTube.hovered);
                            anySelected = true;
                        }
                    }
                }
                if (!anySelected) {
                    const result = view.mousePick('Shape');
                    let shapeNode: ModelNode | null = null;
                    for (let obj of result) {
                        const node = (result[0].object.userData as Object3DUserData).node;
                        if (node) {
                            shapeNode = node;
                            break;
                        }
                    }
                    if (shapeNode) {
                        ctx.model.selected = shapeNode.children.map(node => node.id);
                    } else {
                        ctx.model.selected = [];
                    }
                }
            } else {
                // rect area select
                const camera = view.camera.get();
                for (let node of this.nodes) {
                    const cTube = node.get(CTube);
                    if (!input.isKeyPressed('Control')) {
                        cTube.selected.length = 0;
                    }
                    for (let obj of cTube.pickers) {
                        _pos.setFromMatrixPosition(obj.matrixWorld).project(camera);
                        if (intersectPointRect(_pos, ctx.selectionStart, ctx.selectionEnd)) {
                            const index = (obj.userData as TubeNodePickerUserData).index;
                            if (index != null) {
                                cTube.addSelection(index);
                            }
                        }
                    }
                }
            }
        }
    }

    end(ctx: EditorContext) {
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            cTube.updateColor();
        }
    }

    beforeRender(ctx: EditorContext, view: EditorView) {
        // make indicator circles facing screen
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            getRotation(_rot, node.getWorldMatrix()).invert();
            for (let circle of cTube.circles) {
                circle.quaternion.copy(_rot).multiply(view.camera.get().quaternion);
            }
        }
        if (this.circle.visible) {
            this.circle.quaternion.copy(view.camera.get().quaternion);
        }
    }

    onUnselected(ctx: EditorContext) {
        this.dragging = false;
        this.creating = false;
        this.lastNodeId = 0;
        this.circle.visible = false;
        this.line1.visible = false;
        this.line2.visible = false;
        for (let node of this.nodes) {
            if (node.deleted) {
                continue;
            }
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = false;
            }
            cTube.selected.length = 0;
        }
        this.nodes.length = 0;
    }
}
