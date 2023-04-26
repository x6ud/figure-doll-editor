import {CanvasTexture, MeshBasicMaterial, WebGLRenderer, WebGLRenderTarget} from 'three';
import {FullScreenQuad} from 'three/examples/jsm/postprocessing/Pass';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import {drawOpenposeKeypoints} from './draw-openpose-keypoints';

export default class OpenPosePass extends RenderPass {

    private canvas: HTMLCanvasElement = document.createElement('canvas');
    private ctx2d: CanvasRenderingContext2D = this.canvas.getContext('2d')!;
    private texture = new CanvasTexture(this.canvas);
    private material = new MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    private fsQuad = new FullScreenQuad(this.material);

    setSize(width: number, height: number) {
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.texture.dispose();
        }
    }

    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget) {
        this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
        drawOpenposeKeypoints(this.ctx2d, this.scene, this.camera);
        this.texture.needsUpdate = true;
        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
        }
        renderer.autoClear = false;
        this.material.map = readBuffer.texture;
        this.fsQuad.render(renderer);
        this.material.map = this.texture;
        this.fsQuad.render(renderer);
    }

}
