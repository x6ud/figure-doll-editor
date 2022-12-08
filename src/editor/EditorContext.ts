import {Object3D, Scene, Vector2, WebGLRenderer} from 'three';
import {toRaw} from 'vue';
import EditorView from './EditorView';
import Model from './model/Model';
import ModelHistory from './model/ModelHistory';
import {ProjectReaderResult} from './ProjectReader';
import CallbackFireSystem from './systems/CallbackFireSystem';
import CameraDraggingSystem from './systems/CameraDraggingSystem';
import DefaultLightUpdateSystem from './systems/DefaultLightUpdateSystem';
import HistorySystem from './systems/HistorySystem';
import BoxUpdateFilter from './systems/model-update-filters/BoxUpdateFilter';
import ContainerUpdateFilter from './systems/model-update-filters/ContainerUpdateFilter';
import ImageUpdateFilter from './systems/model-update-filters/ImageUpdateFilter';
import Object3DRelationshipUpdateFilter from './systems/model-update-filters/Object3DRelationshipUpdateFilter';
import ObjUpdateFilter from './systems/model-update-filters/ObjUpdateFilter';
import TransformUpdateFilter from './systems/model-update-filters/TransformUpdateFilter';
import TubeUpdateFilter from './systems/model-update-filters/TubeUpdateFilter';
import ModelUpdateSystem from './systems/ModelUpdateSystem';
import MouseSystem from './systems/MouseSystem';
import RenderSystem from './systems/RenderSystem';
import ToolSystem from './systems/ToolSystem';
import BoxTool from './tools/BoxTool';
import CursorTool from './tools/CursorTool';
import EditorTool from './tools/EditorTool';
import RescaleTool from './tools/RescaleTool';
import RotateTool from './tools/RotateTool';
import TranslateTool from './tools/TranslateTool';
import TubeTool from './tools/TubeTool';
import Grids from './utils/geometry/Grids';
import UpdateSystem from './utils/UpdateSystem';

const GRIDS_SIZE = 200;

export default class EditorContext {

    systems: UpdateSystem<EditorContext>[] = [
        new ModelUpdateSystem([
            new ImageUpdateFilter(),
            new ObjUpdateFilter(),
            new BoxUpdateFilter(),
            new TubeUpdateFilter(),
            new ContainerUpdateFilter(),
            new Object3DRelationshipUpdateFilter(),
            new TransformUpdateFilter(),
        ]),
        new MouseSystem(),
        new ToolSystem(),
        new HistorySystem(),
        new DefaultLightUpdateSystem(),
        new RenderSystem(),
        new CameraDraggingSystem(),
        new CallbackFireSystem(),
    ];

    tools: EditorTool[] = [
        new CursorTool(),
        new TranslateTool(),
        new RotateTool(),
        new RescaleTool(),
        new BoxTool(),
        new TubeTool(),
    ];

    canvas: HTMLCanvasElement;
    renderer: WebGLRenderer;
    scene = new Scene();
    views: EditorView[];
    readonly mainViewIndex: number;
    /** Used for setting transform control handler position */
    dummyObject = new Object3D();

    selectionRectDragging = false;
    selectionRectViewIndex = -1;
    selectionRectSetThisFrame = false;
    selectionStart = new Vector2();
    selectionEnd = new Vector2();

    model = new Model();
    history = new ModelHistory(this.model);
    fps: number = 0;
    private lastTimestamp: number = 0;
    statusBarMessage: string = '';
    tool: EditorTool = this.tools[0];
    nextFrameCallbacks: (() => void)[] = [];
    quadView: boolean = true;
    showGrids: boolean = true;
    keepTransformUnchangedWhileMoving: boolean = true;

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
            new EditorView(this, 0, view1, -Math.PI / 2, -Math.PI / 2, false,
                new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x2F83E3, 0x555555, false)
            ),
            // main
            new EditorView(this, 1, view2, -Math.PI / 8, -Math.PI / 4, true,
                new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x2F83E3, 0x555555)
            ),
            // front
            new EditorView(this, 2, view3, 0, -Math.PI / 2, false,
                new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x6FA51B, 0x555555, false)
                    .rotateX(Math.PI / 2)
            ),
            // right
            new EditorView(this, 3, view4, 0, 0, false,
                new Grids(GRIDS_SIZE, GRIDS_SIZE, 0x6FA51B, 0x2F83E3, 0x555555, false)
                    .rotateZ(Math.PI / 2)
            ),
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
        this.fps = Math.floor(1000 / (now - this.lastTimestamp));
        this.lastTimestamp = now;

        for (let i = 0; i < this.views.length; ++i) {
            const view = this.views[i];
            view.enabled = i === this.mainViewIndex || this.quadView;
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
