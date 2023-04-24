import {Color, Line, Mesh, Object3D, Points, ShaderMaterial, WebGLRenderer, WebGLRenderTarget} from 'three';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import ModelNode from '../../model/ModelNode';
import {getModelNodeDef} from '../../model/ModelNodeDef';

export default class DepthMapPass extends RenderPass {
    overrideMaterial = new ShaderMaterial({
        // language=glsl
        vertexShader: `
            varying float vDepth;

            void main() {
                vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * modelViewPosition;
                vDepth = gl_Position.z;
            }
        `,
        // language=glsl
        fragmentShader: `
            varying float vDepth;
            uniform float uOffset;
            uniform float uScale;

            void main() {
                gl_FragColor = vec4(mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), (vDepth + uOffset) * uScale), 1.0);
            }
        `,
        uniforms: {
            uOffset: {value: 0.0},
            uScale: {value: 0.1},
        }
    });
    offset: number = 0.0;
    scale: number = 0.1;
    clearColor = new Color(0, 0, 0);
    private visibleMap: Map<number, boolean> = new Map();

    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean) {
        // hide non-mesh objects
        const visibleMap = this.visibleMap;
        visibleMap.clear();
        const stack: Object3D[] = [...this.scene.children];
        while (stack.length) {
            const obj = stack.pop();
            if (!obj) {
                break;
            }
            if (obj.visible) {
                const node: ModelNode | undefined = obj.userData.node;
                if ((obj as Mesh).isMesh) {
                    if (node) {
                        if (!getModelNodeDef(node.type).mesh) {
                            obj.visible = false;
                        }
                    } else {
                        obj.visible = false;
                    }
                } else {
                    if ((obj as Points).isPoints || (obj as Line).isLine) {
                        obj.visible = false;
                    }
                }
                if (obj.visible) {
                    stack.push(...obj.children);
                } else {
                    visibleMap.set(obj.id, true);
                }
            }
        }

        // render
        const originOverrideMaterial = this.scene.overrideMaterial;
        this.scene.overrideMaterial = this.overrideMaterial;
        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
        }
        this.overrideMaterial.uniforms.uOffset.value = this.offset;
        this.overrideMaterial.uniforms.uScale.value = this.scale;
        renderer.setClearColor(this.clearColor, 1.0);
        renderer.clear();
        renderer.render(this.scene, this.camera);
        this.scene.overrideMaterial = originOverrideMaterial;

        // restore object visibilities
        stack.push(...this.scene.children);
        while (stack.length) {
            const obj = stack.pop();
            if (!obj) {
                break;
            }
            if (visibleMap.has(obj.id)) {
                obj.visible = true;
            }
            if (obj.visible) {
                stack.push(...obj.children);
            }
        }
    }
}
