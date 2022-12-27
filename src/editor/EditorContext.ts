import {Object3D, Scene, Vector2, WebGLRenderer} from 'three';
import {toRaw} from 'vue';
import EditorOptions from './EditorOptions';
import EditorView from './EditorView';
import Model from './model/Model';
import ModelHistory from './model/ModelHistory';
import {ProjectReaderResult} from './ProjectReader';
import CallbackFireSystem from './systems/CallbackFireSystem';
import CameraDraggingSystem from './systems/CameraDraggingSystem';
import DefaultLightUpdateSystem from './systems/DefaultLightUpdateSystem';
import HistorySystem from './systems/HistorySystem';
import IkBoneVisibleUpdateSystem from './systems/IkBoneVisibleUpdateSystem';
import BoxUpdateFilter from './systems/model-update-filters/BoxUpdateFilter';
import ClayUpdateFilter from './systems/model-update-filters/ClayUpdateFilter';
import ContainerUpdateFilter from './systems/model-update-filters/ContainerUpdateFilter';
import CustomShapeUpdateFilter from './systems/model-update-filters/CustomShapeUpdateFilter';
import IkChainUpdateFilter from './systems/model-update-filters/IkChainUpdateFilter';
import ImageUpdateFilter from './systems/model-update-filters/ImageUpdateFilter';
import ImportModelUpdateFilter from './systems/model-update-filters/ImportModelUpdateFilter';
import Object3DRelationshipUpdateFilter from './systems/model-update-filters/Object3DRelationshipUpdateFilter';
import OpacityUpdateFilter from './systems/model-update-filters/OpacityUpdateFilter';
import TransformUpdateFilter from './systems/model-update-filters/TransformUpdateFilter';
import TubeUpdateFilter from './systems/model-update-filters/TubeUpdateFilter';
import ModelUpdateSystem from './systems/ModelUpdateSystem';
import MouseSystem from './systems/MouseSystem';
import RenderSystem from './systems/RenderSystem';
import ToolSystem from './systems/ToolSystem';
import BoxTool from './tools/BoxTool';
import CursorTool from './tools/CursorTool';
import EditorTool from './tools/EditorTool';
import IkBindTool from './tools/IkBindTool';
import IkRotateTool from './tools/IkRotateTool';
import RescaleTool from './tools/RescaleTool';
import RotateTool from './tools/RotateTool';
import SculptBrushTool from './tools/SculptBrushTool';
import SculptCreaseTool from './tools/SculptCreaseTool';
import SculptDragTool from './tools/SculptDragTool';
import SculptFlattenTool from './tools/SculptFlattenTool';
import SculptInflateTool from './tools/SculptInflateTool';
import SculptMoveTool from './tools/SculptMoveTool';
import SculptPinchTool from './tools/SculptPinchTool';
import SculptSmoothTool from './tools/SculptSmoothTool';
import ToolSeperator from './tools/ToolSeperator';
import TranslateTool from './tools/TranslateTool';
import TubeTool from './tools/TubeTool';
import UpdateSystem from './utils/UpdateSystem';

export default class EditorContext {

    systems: UpdateSystem<EditorContext>[] = [
        new ModelUpdateSystem([
            new ImageUpdateFilter(),
            new ImportModelUpdateFilter(),
            new BoxUpdateFilter(),
            new CustomShapeUpdateFilter(),
            new TubeUpdateFilter(),
            new ClayUpdateFilter(),
            new ContainerUpdateFilter(),
            new IkChainUpdateFilter(),
            new Object3DRelationshipUpdateFilter(),
            new TransformUpdateFilter(),
            new OpacityUpdateFilter(),
        ]),
        new MouseSystem(),
        new ToolSystem(),
        new HistorySystem(),
        new IkBoneVisibleUpdateSystem(),
        new DefaultLightUpdateSystem(),
        new RenderSystem(),
        new CameraDraggingSystem(),
        new CallbackFireSystem(),
    ];

    sculptSmoothTool = new SculptSmoothTool();
    tools: EditorTool[] = [
        new CursorTool(),
        ToolSeperator.instance,
        new TranslateTool(),
        new RotateTool(),
        new RescaleTool(),
        ToolSeperator.instance,
        new IkBindTool(),
        new IkRotateTool(),
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
    scene = new Scene();
    views: EditorView[];
    readonly mainViewIndex: number;
    /** Used for setting transform control handler position */
    dummyObject = new Object3D();
    disableCameraDraggingThisFrame = false;

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
        this.scene.add(this.dummyObject);
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
                    Math.abs(camera.alpha % (Math.PI / 2)) > 1e-8
                    || Math.abs(camera.beta % (Math.PI / 2)) > 1e-8;
            }
        }
        for (let view of this.views) {
            if (view.enabled) {
                view.update();
            }
        }
        for (let system of this.systems) {
            system.update(this);
        }
        for (let view of this.views) {
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

    load(data: ProjectReaderResult) {
        this.reset();
        for (let i = 0; i < 4; ++i) {
            const state = data.views[i];
            const view = this.views[i];
            view.zoomLevel = state.zoomLevel;
            view.camera.alpha = state.alpha;
            view.camera.beta = state.beta;
            view.camera.target.set(...state.target);
        }
        for (let node of data.nodes) {
            this.model.createNode(
                node.id,
                node.type,
                node.parentId ? this.model.getNode(node.parentId) : null,
                null,
                node.data
            );
        }
    }

}
