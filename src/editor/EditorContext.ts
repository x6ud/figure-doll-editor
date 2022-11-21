import {Scene, WebGLRenderer} from 'three';
import EditorView from './EditorView';
import CameraDraggingSystem from './systems/CameraDraggingSystem';
import MouseSystem from './systems/MouseSystem';
import RenderSystem from './systems/RenderSystem';
import UpdateSystem from './utils/UpdateSystem';

export default class EditorContext {
    canvas: HTMLCanvasElement;
    renderer: WebGLRenderer;
    scene = new Scene();
    views: EditorView[];

    systems: UpdateSystem<EditorContext>[] = [
        new MouseSystem(),
        new RenderSystem(),
        new CameraDraggingSystem(),
    ];

    readonly mainViewIndex: number;
    quadView: boolean = true;

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
            new EditorView(1, view2, -Math.PI / 4, -Math.PI / 3, true),
            // front
            new EditorView(2, view3, 0, -Math.PI / 2, false),
            // right
            new EditorView(3, view4, 0, 0, false),
        ];
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
