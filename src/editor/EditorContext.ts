import {PCFSoftShadowMap, Scene, Vector2, WebGLRenderer} from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer';
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {toRaw} from 'vue';
import EditorOptions from './EditorOptions';
import EditorView from './EditorView';
import Model from './model/Model';
import ModelHistory from './model/ModelHistory';
import {ProjectReaderResult} from './ProjectReader';
import CallbackFireSystem from './systems/CallbackFireSystem';
import CameraDraggingSystem from './systems/CameraDraggingSystem';
import CsgUpdateSystem from './systems/CsgUpdateSystem';
import HistorySystem from './systems/HistorySystem';
import IkBoneVisibleUpdateSystem from './systems/IkBoneVisibleUpdateSystem';
import LightUpdateSystem from './systems/LightUpdateSystem';
import BoxUpdateFilter from './systems/model-update-filters/BoxUpdateFilter';
import ClayUpdateFilter from './systems/model-update-filters/ClayUpdateFilter';
import ContainerUpdateFilter from './systems/model-update-filters/ContainerUpdateFilter';
import IkChainUpdateFilter from './systems/model-update-filters/IkChainUpdateFilter';
import ImageUpdateFilter from './systems/model-update-filters/ImageUpdateFilter';
import ImportModelUpdateFilter from './systems/model-update-filters/ImportModelUpdateFilter';
import InstanceNodeUpdateFilter from './systems/model-update-filters/InstanceNodeUpdateFilter';
import LightHelperUpdateFilter from './systems/model-update-filters/LightHelperUpdateFilter';
import LightUpdateFilter from './systems/model-update-filters/LightUpdateFilter';
import MaterialUpdateFilter from './systems/model-update-filters/MaterialUpdateFilter';
import MirrorUpdateFilter from './systems/model-update-filters/MirrorUpdateFilter';
import Object3DRelationshipUpdateFilter from './systems/model-update-filters/Object3DRelationshipUpdateFilter';
import OpacityUpdateFilter from './systems/model-update-filters/OpacityUpdateFilter';
import SdfShapeUpdateFilter from './systems/model-update-filters/SdfShapeUpdateFilter';
import ShadowUpdateFilter from './systems/model-update-filters/ShadowUpdateFilter';
import TransformUpdateFilter from './systems/model-update-filters/TransformUpdateFilter';
import TubeUpdateFilter from './systems/model-update-filters/TubeUpdateFilter';
import ModelUpdateSystem from './systems/ModelUpdateSystem';
import MouseSystem from './systems/MouseSystem';
import OutlineUpdateSystem from './systems/OutlineUpdateSystem';
import RenderSystem from './systems/RenderSystem';
import ToolSystem from './systems/ToolSystem';
import BoxTool from './tools/BoxTool';
import CursorTool from './tools/CursorTool';
import EditorTool from './tools/EditorTool';
import GizmoTool from './tools/GizmoTool';
import IkBindTool from './tools/IkBindTool';
import IkJointStretchTool from './tools/IkJointStretchTool';
import IkMoveTool from './tools/IkMoveTool';
import IkRotateTool from './tools/IkRotateTool';
import SculptBrushTool from './tools/SculptBrushTool';
import SculptCreaseTool from './tools/SculptCreaseTool';
import SculptDragTool from './tools/SculptDragTool';
import SculptFlattenTool from './tools/SculptFlattenTool';
import SculptInflateTool from './tools/SculptInflateTool';
import SculptMoveTool from './tools/SculptMoveTool';
import SculptPaintTool from './tools/SculptPaintTool';
import SculptPinchTool from './tools/SculptPinchTool';
import SculptSmoothTool from './tools/SculptSmoothTool';
import SculptTransformTool from './tools/SculptTransformTool';
import ToolSeperator from './tools/ToolSeperator';
import TubeTool from './tools/TubeTool';
import SelectionRect from './utils/SelectionRect';
import UpdateSystem from './utils/UpdateSystem';

export default class EditorContext {

    systems: UpdateSystem<EditorContext>[] = [
        new CsgUpdateSystem(),
        new ModelUpdateSystem([
            new InstanceNodeUpdateFilter(),
            new LightUpdateFilter(),
            new ImageUpdateFilter(),
            new ImportModelUpdateFilter(),
            new BoxUpdateFilter(),
            new SdfShapeUpdateFilter(),
            new TubeUpdateFilter(),
            new ClayUpdateFilter(),
            new MirrorUpdateFilter(),
            new ContainerUpdateFilter(),
            new IkChainUpdateFilter(),
            new Object3DRelationshipUpdateFilter(),
            new TransformUpdateFilter(),
            new ShadowUpdateFilter(),
            new LightHelperUpdateFilter(),
            new MaterialUpdateFilter(),
            new OpacityUpdateFilter(),
        ]),
        new MouseSystem(),
        new ToolSystem(),
        new HistorySystem(),
        new IkBoneVisibleUpdateSystem(),
        new LightUpdateSystem(),
        new OutlineUpdateSystem(),
        new RenderSystem(),
        new CameraDraggingSystem(),
        new CallbackFireSystem(),
    ];

    sculptSmoothTool = new SculptSmoothTool();
    tools: EditorTool[] = [
        new CursorTool(),
        new GizmoTool(),
        ToolSeperator.instance,
        new IkRotateTool(),
        new IkMoveTool(),
        ToolSeperator.instance,
        new IkBindTool(),
        new IkJointStretchTool(),
        ToolSeperator.instance,
        new BoxTool(),
        new TubeTool(),
        ToolSeperator.instance,
        new SculptBrushTool(),
        new SculptInflateTool(),
        new SculptCreaseTool(),
        new SculptPinchTool(),
        new SculptFlattenTool(),
        new SculptMoveTool(),
        new SculptDragTool(),
        this.sculptSmoothTool,
        new SculptTransformTool(),
        new SculptPaintTool(),
    ];

    sculptNodeId = 0;
    sculptActiveView = -1;
    sculptSym = false;
    sculptLocalRadius = 0;
    sculptMoved = false;
    sculptStartThisFrame = false;
    sculptAccWalkedPixels = 0;
    sculptX0 = 0;
    sculptY0 = 0;
    sculptX1 = 0;
    sculptY1 = 0;

    canvas: HTMLCanvasElement;
    renderer: WebGLRenderer;
    composer: EffectComposer;
    renderPass: RenderPass;
    outlinePass: OutlinePass;
    scene = new Scene();
    views: EditorView[];
    readonly mainViewIndex: number;
    disableCameraDraggingThisFrame = false;

    selectionRect = new SelectionRect();
    selectionRectDragging = false;
    selectionRectViewIndex = -1;
    selectionRectSetThisFrame = false;
    selectionStart = new Vector2();
    selectionEnd = new Vector2();

    model = new Model();
    history = new ModelHistory(this.model);
    fps: number = 0;
    detSec: number = 0;
    private lastTimestamp: number = 0;
    statusBarMessage: string = '';
    tool: EditorTool = this.tools[0];
    nextFrameCallbacks: (() => void)[] = [];
    throttleTasks: Map<string, { time: number, callback: () => void }> = new Map();

    options = new EditorOptions();

    constructor(
        canvas: HTMLCanvasElement,
        view1: HTMLElement,
        view2: HTMLElement,
        view3: HTMLElement,
        view4: HTMLElement,
    ) {
        this.history.setup();
        this.canvas = canvas;

        this.renderer = new WebGLRenderer({canvas});
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;

        this.mainViewIndex = 1;
        this.views = [
            // top
            new EditorView(this, 0, view1, -Math.PI / 2, -Math.PI / 2, false),
            // main
            new EditorView(this, 1, view2, -Math.PI / 8, -Math.PI / 4, true),
            // front
            new EditorView(this, 2, view3, 0, -Math.PI / 2, false),
            // right
            new EditorView(this, 3, view4, 0, 0, false),
        ];

        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(
            this.scene,
            this.views[this.mainViewIndex].camera.get()
        );
        this.composer.addPass(this.renderPass);
        this.outlinePass = new OutlinePass(
            new Vector2(),
            this.scene,
            this.renderPass.camera
        );
        this.outlinePass.visibleEdgeColor.setHex(0xf3982d);
        this.composer.addPass(this.outlinePass);

        for (let system of this.systems) {
            system.setup(this);
        }
        for (let tool of this.tools) {
            tool.setup(this);
        }
    }

    dispose() {
        this.history.unload();
        for (let view of this.views) {
            view.dispose();
        }
        for (let system of this.systems) {
            system.dispose();
        }
        for (let tool of this.tools) {
            tool.dispose();
        }
        this.renderer.dispose();
    }

    update() {
        const now = Date.now();
        this.detSec = (now - this.lastTimestamp) / 1000;
        this.fps = Math.floor(1 / this.detSec);
        this.lastTimestamp = now;

        for (let i = 0; i < this.views.length; ++i) {
            const view = this.views[i];
            view.enabled = i === this.mainViewIndex || this.options.quadView;
            if (i === this.mainViewIndex) {
                const camera = view.camera;
                camera.perspective =
                    this.model.cameraPerspective && (
                        Math.abs(camera.alpha % (Math.PI / 2)) > 1e-8
                        || Math.abs(camera.beta % (Math.PI / 2)) > 1e-8
                    );
                camera.perspectiveCamera.fov = this.model.cameraFov;
            }
        }
        for (let view of this.views) {
            view = toRaw(view);
            if (view.enabled) {
                view.update();
            }
        }
        for (let system of this.systems) {
            system.update(this);
        }
        for (let view of this.views) {
            view = toRaw(view);
            view.input.update();
        }
    }

    reset() {
        this.views[this.mainViewIndex].camera.alpha = -Math.PI / 8;
        this.views[this.mainViewIndex].camera.beta = -Math.PI / 4;
        for (let view of this.views) {
            view.camera.target.set(0, 0, 0);
            view.zoomLevel = 0;
        }
        this.model.reset();
        this.history.clear();
    }

    /** Get the raw reference from vue proxy. This can improve performance. Only use if the update doesn't affect the ui. */
    readonlyRef(): EditorContext {
        return toRaw(this);
    }

    nextFrameEnd(callback: () => void) {
        this.nextFrameCallbacks.push(callback);
    }

    throttle(hash: string, delayMs: number, callback: () => void, immediate = false) {
        const task = this.throttleTasks.get(hash);
        if (task) {
            if (!immediate) {
                task.time = Date.now() + delayMs;
            }
            task.callback = callback;
        } else {
            if (immediate) {
                callback();
                this.throttleTasks.set(hash, {
                    time: Date.now() + delayMs, callback: () => {
                    }
                });
            } else {
                this.throttleTasks.set(hash, {time: Date.now() + delayMs, callback});
            }
        }
    }

    delayThrottle(hash: string, delayMs: number) {
        const task = this.throttleTasks.get(hash);
        if (task) {
            task.time = Date.now() + delayMs;
        }
    }

    /** Load project data */
    load(data: ProjectReaderResult) {
        this.reset();
        for (let i = 0; i < 4; ++i) {
            const state = data.views[i];
            const view = this.views[i];
            view.zoomLevel = state.zoomLevel;
            view.camera.alpha = state.alpha;
            view.camera.beta = state.beta;
            view.camera.target.set(...state.target);
            if (i === this.mainViewIndex) {
                view.camera.perspective = state.perspective;
                view.camera.perspectiveCamera.fov = state.fov;
                this.model.cameraPerspective = state.perspective;
                this.model.cameraFov = state.fov;
            }
        }
        this.model.cameras = data.cameras;
        for (let nodeInfo of data.nodes) {
            const node = this.model.createNode(
                nodeInfo.id,
                nodeInfo.type,
                nodeInfo.parentId ? this.model.getNode(nodeInfo.parentId) : null,
                null,
                nodeInfo.data,
                nodeInfo.instanceId,
            );
            node.expanded = nodeInfo.expanded;
        }
    }

}
