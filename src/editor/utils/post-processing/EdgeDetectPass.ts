import {
    DepthTexture,
    Line,
    Mesh,
    MeshNormalMaterial,
    Object3D,
    Points,
    ShaderMaterial,
    Vector4,
    WebGLRenderer,
    WebGLRenderTarget
} from 'three';
import {FullScreenQuad} from 'three/examples/jsm/postprocessing/Pass';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass';
import CRenderEdge from '../../model/components/CRenderEdge';
import ModelNode from '../../model/ModelNode';
import {getModelNodeDef} from '../../model/ModelNodeDef';

export default class EdgeDetectPass extends RenderPass {

    private edgeMaterial = new ShaderMaterial({
        // language=glsl
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        // language=glsl
        fragmentShader: `
            varying vec2 vUv;

            uniform sampler2D uTexNormal;
            uniform sampler2D uTexDepth;
            uniform vec4 uResolution;
            uniform float uNormalThreshold;
            uniform float uDepthThreshold;

            vec3 getNormal(int x, int y) {
                return texture2D(uTexNormal, vUv + vec2(x, y) * uResolution.zw).rgb * 2.0 - 1.0;
            }

            float getDepth(int x, int y) {
                return texture2D(uTexDepth, vUv + vec2(x, y) * uResolution.zw).r;
            }

            float neighborNormalEdgeIndicator(int x, int y, vec3 normal) {
                vec3 neighborNormal = getNormal(x, y);
                vec3 normalEdgeBias = vec3(1.0, 1.0, 1.0);
                float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
                float normalIndicator = clamp(normalDiff, 0.0, 1.0);
                return (1.0 - dot(normal, neighborNormal)) * normalIndicator;
            }

            float depthEdgeIndicator(float depth) {
                float diff = 0.0;

                diff += abs(getDepth(1, 0) - depth);
                diff += abs(getDepth(-1, 0) - depth);
                diff += abs(getDepth(0, 1) - depth);
                diff += abs(getDepth(0, -1) - depth);

                diff += abs(getDepth(1, 1) - depth);
                diff += abs(getDepth(-1, -1) - depth);
                diff += abs(getDepth(-1, 1) - depth);
                diff += abs(getDepth(1, -1) - depth);

                diff += abs(getDepth(2, 0) - depth);
                diff += abs(getDepth(-2, 0) - depth);
                diff += abs(getDepth(0, 2) - depth);
                diff += abs(getDepth(0, -2) - depth);

                return diff * 4.0 > uDepthThreshold ? 1.0 : 0.0;
            }

            float normalEdgeIndicator(vec3 normal) {
                float indicator = 0.0;

                indicator += neighborNormalEdgeIndicator(0, -1, normal);
                indicator += neighborNormalEdgeIndicator(0, 1, normal);
                indicator += neighborNormalEdgeIndicator(-1, 0, normal);
                indicator += neighborNormalEdgeIndicator(1, 0, normal);

                indicator += neighborNormalEdgeIndicator(-1, -1, normal);
                indicator += neighborNormalEdgeIndicator(1, 1, normal);
                indicator += neighborNormalEdgeIndicator(-1, 1, normal);
                indicator += neighborNormalEdgeIndicator(1, -1, normal);

                indicator += neighborNormalEdgeIndicator(0, -2, normal);
                indicator += neighborNormalEdgeIndicator(0, 2, normal);
                indicator += neighborNormalEdgeIndicator(-2, 0, normal);
                indicator += neighborNormalEdgeIndicator(2, 0, normal);

                return indicator * 0.5 > uNormalThreshold ? 1.0 : 0.0;
            }

            void main() {
                float ni = normalEdgeIndicator(getNormal(0, 0));
                float di = depthEdgeIndicator(getDepth(0, 0));
                gl_FragColor.rgb = vec3(1.0, 1.0, 1.0) * (ni + di);
                gl_FragColor.a = 1.0;
            }
        `,
        uniforms: {
            uTexNormal: {value: null},
            uTexDepth: {value: null},
            uResolution: {value: new Vector4()},
            uNormalThreshold: {value: 0.0},
            uDepthThreshold: {value: 0.0},
        }
    });
    private normalMaterial = new MeshNormalMaterial();
    private normalRenderTarget = new WebGLRenderTarget(1, 1, {depthBuffer: true, depthTexture: new DepthTexture(1, 1)});
    private fsQuad = new FullScreenQuad(this.edgeMaterial);

    private visibleMap: Map<number, boolean> = new Map();

    normalThreshold = 0.5;
    depthThreshold = 0.1;

    dispose() {
        this.normalMaterial.dispose();
        this.normalRenderTarget.dispose();
        this.edgeMaterial.dispose();
        this.fsQuad.dispose();
    }

    setSize(width: number, height: number) {
        this.normalRenderTarget.setSize(width, height);
        this.edgeMaterial.uniforms.uResolution.value.set(width, height, 1 / width, 1 / height);
    }

    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget) {
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
                if (node && node.has(CRenderEdge) && !node.value(CRenderEdge)) {
                    obj.visible = false;
                }
                if (obj.visible) {
                    stack.push(...obj.children);
                } else {
                    visibleMap.set(obj.id, true);
                }
            }
        }

        // render normal
        const originalOverrideMaterial = this.scene.overrideMaterial;
        this.scene.overrideMaterial = this.normalMaterial;
        renderer.setRenderTarget(this.normalRenderTarget);
        renderer.render(this.scene, this.camera);
        this.scene.overrideMaterial = originalOverrideMaterial;

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

        // render edge
        this.edgeMaterial.uniforms.uTexNormal.value = this.normalRenderTarget.texture;
        this.edgeMaterial.uniforms.uTexDepth.value = this.normalRenderTarget.depthTexture;
        this.edgeMaterial.uniforms.uNormalThreshold.value = this.normalThreshold;
        this.edgeMaterial.uniforms.uDepthThreshold.value = this.depthThreshold;
        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
        } else {
            renderer.setRenderTarget(writeBuffer);
        }
        this.fsQuad.render(renderer);
    }
}
