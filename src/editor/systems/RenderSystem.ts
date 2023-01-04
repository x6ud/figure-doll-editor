import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import ArcRotateCamera from '../utils/camera/ArcRotateCamera';
import Grids from '../utils/geometry/Grids';
import UpdateSystem from '../utils/UpdateSystem';

const GRIDS_SIZE = 200;

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);

const _cross = new Vector3();

function isCameraParallelTo(camera: ArcRotateCamera, axis: Vector3) {
    return _cross.crossVectors(camera._dir, axis).lengthSq() < 1e-8;
}

export default class RenderSystem extends UpdateSystem<EditorContext> {

    private groundGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x2F83E3, 0x555555);
    private xzGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x2F83E3, 0x555555, false);
    private xyGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0xF63652, 0x6FA51B, 0x555555, false)
        .rotateX(Math.PI / 2);
    private yzGrids = new Grids(GRIDS_SIZE, GRIDS_SIZE, 0x6FA51B, 0x2F83E3, 0x555555, false)
        .rotateZ(Math.PI / 2);

    setup(ctx: EditorContext) {
        ctx.scene.add(this.groundGrids);
        ctx.scene.add(this.xzGrids);
        ctx.scene.add(this.xyGrids);
        ctx.scene.add(this.yzGrids);
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        const rect = ctx.canvas.getBoundingClientRect();
        const renderer = ctx.renderer;
        renderer.setScissorTest(true);
        renderer.setClearColor(0x000000, 0.0);
        renderer.clear();
        const useDefaultLight = ctx.options.shadingMode === 'solid';
        for (let curr of ctx.views) {
            for (let view of ctx.views) {
                const active = curr === view;
                view.transformControls.visible = active && ctx.tool.enableTransformControls;
                view.defaultLight.visible = useDefaultLight && active;
            }
            if (curr.enabled && curr.width && curr.height) {
                const camera = curr.camera;
                this.xzGrids.visible = ctx.options.showGrids && isCameraParallelTo(camera, Y_AXIS);
                this.xyGrids.visible = ctx.options.showGrids && isCameraParallelTo(camera, Z_AXIS);
                this.yzGrids.visible = ctx.options.showGrids && isCameraParallelTo(camera, X_AXIS);
                this.groundGrids.visible = ctx.options.showGrids && !(this.xzGrids.visible || this.xyGrids.visible || this.yzGrids.visible);
                ctx.tool.beforeRender(ctx, curr);
                renderer.setViewport(-rect.left + curr.left, rect.bottom - curr.bottom, curr.width, curr.height);
                renderer.setScissor(-rect.left + curr.left, rect.bottom - curr.bottom, curr.width, curr.height);
                renderer.render(ctx.scene, camera.get());
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
