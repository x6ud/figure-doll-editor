import {BoxGeometry, DirectionalLight, Mesh, MeshStandardMaterial} from 'three';
import {defineComponent, ref} from 'vue';
import RenderLoop from '../common/utils/RenderLoop';
import QuadView from './components/QuadView/QuadView.vue';
import EditorContext from './EditorContext';

export default defineComponent({
    components: {
        QuadView
    },
    setup() {
        let editorContext: EditorContext;
        const renderLoop = new RenderLoop(function () {
            editorContext.update();
        });
        const quadView = ref(true);

        function onCanvasMounted(
            canvas: HTMLCanvasElement,
            view1: HTMLElement,
            view2: HTMLElement,
            view3: HTMLElement,
            view4: HTMLElement,
        ) {
            editorContext = new EditorContext(canvas, view1, view2, view3, view4);
            editorContext.quadView = quadView.value;
            renderLoop.start();

            const geometry = new BoxGeometry(1, 2, 1);
            const material = new MeshStandardMaterial({color: 0xff00ff});
            const cube = new Mesh(geometry, material);
            editorContext.scene.add(cube);

            const light = new DirectionalLight(0xffffff, 1.0);
            light.position.x = 0.5;
            light.position.z = 5;
            editorContext.scene.add(light);

            (window as any).ctx = editorContext;
        }

        return {
            quadView,
            onCanvasMounted,
        };
    }
});
