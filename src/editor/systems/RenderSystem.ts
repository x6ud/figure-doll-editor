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

const outputCamera = new ArcRotateCamera();

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

        if (ctx.depthMapOutput || ctx.edgeOutput) {
            renderer.setScissorTest(false);
            const view = ctx.views[ctx.mainViewIndex];
            outputCamera.copy(view.camera);
            outputCamera.update(512, 512);
            renderer.setViewport(0, ctx.canvas.height - 512, 512, 512);
            if (ctx.depthMapOutput) {
                ctx.depthMapPass.camera = outputCamera.get();
                ctx.depthMapComposer.setSize(512, 512);
                ctx.depthMapComposer.render();
                ctx.depthMapOutput.drawImage(ctx.canvas, 0, 0, 512, 512, 0, 0, 512, 512);
            }
            if (ctx.edgeOutput) {
                ctx.edgeDetectPass.camera = outputCamera.get();
                ctx.edgeComposer.setSize(512, 512);
                ctx.edgeComposer.render();
                ctx.edgeOutput.drawImage(ctx.canvas, 0, 0, 512, 512, 0, 0, 512, 512);
            }
        }

        renderer.setScissorTest(true);
        renderer.setClearColor(0x000000, 0.0);
        renderer.clear();
        const useDefaultLight = ctx.options.shadingMode === 'solid';
        for (let curr of ctx.views) {
            for (let view of ctx.views) {
                const active = curr === view;
                view.gizmo.visible = active && view.gizmoEnabled;
                view.gizmo.size = ctx.options.quadView ? 1 / 2 : 1 / 4;
                view.defaultLights.visible = useDefaultLight && active;
            }
            if (curr.enabled && curr.width && curr.height) {
                const camera = curr.camera;
                this.xzGrids.visible = ctx.options.showGrids && isCameraParallelTo(camera, Y_AXIS);
                this.xyGrids.visible = ctx.options.showGrids && isCameraParallelTo(camera, Z_AXIS);
                this.yzGrids.visible = ctx.options.showGrids && isCameraParallelTo(camera, X_AXIS);
                this.groundGrids.visible = ctx.options.showGrids && !(this.xzGrids.visible || this.xyGrids.visible || this.yzGrids.visible);
                ctx.tool.beforeRender(ctx, curr);
                const x = -rect.left + curr.left;
                const y = rect.bottom - curr.bottom;
                const w = curr.width;
                const h = curr.height;
                renderer.setViewport(x, y, w, h);
                renderer.setScissor(x, y, w, h);
                switch (ctx.options.shadingMode) {
                    case 'solid':
                    case 'rendered': {
                        ctx.renderPass.camera = camera.get();
                        ctx.outlinePass.renderCamera = camera.get();
                        ctx.defaultComposer.setSize(w, h);
                        ctx.defaultComposer.render();
                    }
                        break;
                    case 'depth': {
                        ctx.depthMapPass.camera = camera.get();
                        ctx.depthMapPass.offset = ctx.options.depthMapOffset;
                        ctx.depthMapPass.scale = ctx.options.depthMapScale;
                        ctx.depthMapComposer.setSize(w, h);
                        ctx.depthMapComposer.render();
                    }
                        break;
                    case 'edge': {
                        ctx.edgeDetectPass.camera = camera.get();
                        ctx.edgeDetectPass.normalThreshold = ctx.options.edgeDetectNormalThreshold;
                        ctx.edgeDetectPass.depthThreshold = ctx.options.edgeDetectDepthThreshold;
                        ctx.edgeComposer.setSize(w, h);
                        ctx.edgeComposer.render();
                    }
                        break;
                }
            }
        }
        ctx.tool.afterRender(ctx);
    }

    end(ctx: EditorContext): void {
    }

}
