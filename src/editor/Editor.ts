import {DirectionalLight} from 'three';
import {defineComponent, ref} from 'vue';
import Class from '../common/type/Class';
import RenderLoop from '../common/utils/RenderLoop';
import {createTransitionAnimation} from '../common/utils/transition';
import ModelTree from './components/ModelTree/ModelTree.vue';
import PopupMenu from './components/popup/PopupMenu/PopupMenu.vue';
import PopupMenuItem from './components/popup/PopupMenu/PopupMenuItem.vue';
import QuadView from './components/QuadView/QuadView.vue';
import SidePanel from './components/SidePanel/SidePanel.vue';
import EditorContext from './EditorContext';
import ModelNode from './model/ModelNode';
import ModelNodeComponent from './model/ModelNodeComponent';

export default defineComponent({
    components: {
        ModelTree,
        PopupMenu,
        PopupMenuItem,
        QuadView,
        SidePanel,
    },
    setup() {
        const dom = ref<HTMLElement>();
        const editorContext = ref<EditorContext>();
        const renderLoop = new RenderLoop(function () {
            editorContext.value?.update();
        });
        const modelTreePanelWidth = ref(250);

        function focus() {
            dom.value?.focus();
        }

        function onCanvasMounted(
            canvas: HTMLCanvasElement,
            view1: HTMLElement,
            view2: HTMLElement,
            view3: HTMLElement,
            view4: HTMLElement,
        ) {
            editorContext.value = new EditorContext(canvas, view1, view2, view3, view4);
            renderLoop.start();

            const light = new DirectionalLight(0xffffff, 1.0);
            light.position.x = 0.5;
            light.position.z = 5;
            editorContext.value.scene.add(light);

            const ctx = (window as any).ctx = editorContext.value!;
            const n0 = ctx.model.createNode(0, 'container');
            const n1 = ctx.model.createNode(1, 'container');
            const n2 = ctx.model.createNode(2, 'container', n0);
            const n3 = ctx.model.createNode(3, 'container', n2);
            const n4 = ctx.model.createNode(4, 'container');
            ctx.model.selected = [0, 3];
        }

        function onBeforeCanvasUnmount() {
            editorContext.value?.dispose();
            editorContext.value = undefined;
        }

        function onSetView(face: string) {
            const ctx = editorContext.value!;
            const view = ctx.views[ctx.mainViewIndex];
            const camera = view.camera;
            let alpha = camera.alpha;
            let beta = camera.beta;
            switch (face) {
                case 'front':
                    alpha = 0;
                    beta = -Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = +Math.PI / 2;
                    }
                    break;
                case 'back':
                    alpha = 0;
                    beta = +Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = -Math.PI / 2;
                    }
                    break;
                case 'top':
                    alpha = -Math.PI / 2;
                    beta = -Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = +Math.PI / 2;
                        beta = -Math.PI / 2;
                    }
                    break;
                case 'bottom':
                    alpha = +Math.PI / 2;
                    beta = -Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = -Math.PI / 2;
                        beta = -Math.PI / 2;
                    }
                    break;
                case 'right':
                    alpha = 0;
                    beta = 0;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = Math.PI;
                    }
                    break;
                case 'left':
                    alpha = 0;
                    beta = Math.PI;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = 0;
                    }
                    break;
            }
            const da = alpha - camera.alpha;
            const db = beta - camera.beta;
            createTransitionAnimation(function (t) {
                camera.alpha = alpha - da * (1 - t);
                camera.beta = beta - db * (1 - t);
            }, 100);
        }

        function onSetValue(node: ModelNode, componentClass: Class<ModelNodeComponent<any>>, value: any) {
            editorContext.value!.history.setValue(node, componentClass, value);
        }

        function onMoveNode(related: ModelNode, position: 'before' | 'after' | 'atFirst' | 'atLast') {
        }

        return {
            dom,
            editorContext,
            modelTreePanelWidth,
            onCanvasMounted,
            onBeforeCanvasUnmount,
            onSetView,
            onSetValue,
            onMoveNode,
        };
    }
});
