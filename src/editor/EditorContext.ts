import {Scene, WebGLRenderer} from 'three';
import EditorView from './EditorView';
import CameraDraggingSystem from './systems/CameraDraggingSystem';
import MouseSystem from './systems/MouseSystem';
import RenderSystem from './systems/RenderSystem';
import Grids from './utils/geometry/Grids';
import UpdateSystem from './utils/UpdateSystem';

const GRIDS_SIZE = 200;

export default class EditorContext {

    systems: UpdateSystem<EditorContext>[] = [
        new MouseSystem(),
        new RenderSystem(),
        new CameraDraggingSystem(),
    ];

    canvas: HTMLCanvasElement;
    renderer: WebGLRenderer;
    scene = new Scene();
    views: EditorView[];
    xzGrids: Grids;
    yzGrids: Grids;
    xyGrids: Grids;
    readonly mainViewIndex: number;

    quadView: boolean = true;
    showGrids: boolean = true;

    constructor(
        canvas: HTMLCanvasElement,
        view1: HTMLElement,
        view2: HTMLElement,
        view3: HTMLElement,
        view4: HTMLElement,
    ) {
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({canvas});
        this.mainViewIndex = 1;
        this.views = [
            // top
            new EditorView(0, view1, -Math.PI / 2, -Math.PI / 2, false),
            // main
            new EditorView(1, view2, -Math.PI / 10, -Math.PI / 2.5, true),
            // front
            new EditorView(2, view3, 0, -Math.PI / 2, false),
            // right
            new EditorView(3, view4, 0, 0, false),
        ];
        this.xzGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x6FA51B, 0x6B6B6B);
        this.yzGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x2F83E3, 0x6B6B6B);
        this.yzGrids.rotateX(Math.PI / 2);
        this.xyGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0x2F83E3, 0x6FA51B, 0x6B6B6B);
        this.xyGrids.rotateZ(Math.PI / 2);
        this.scene.add(this.xzGrids);
        this.scene.add(this.yzGrids);
        this.scene.add(this.xyGrids);
    }

    dispose() {
        for (let view of this.views) {
            view.dispose();
        }
    }

    update() {
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

}
