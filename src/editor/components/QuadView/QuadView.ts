import {defineComponent, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import EditorContext from '../../EditorContext';
import ViewRotationHandler from '../ViewRotationHandler/ViewRotationHandler.vue';

export default defineComponent({
    components: {ViewRotationHandler},
    props: {
        editorContext: EditorContext,
        quadView: Boolean
    },
    emits: ['mounted', 'beforeUnmount', 'setView'],
    setup(props, ctx) {
        const wrapper = ref<HTMLElement>();
        const canvas = ref<HTMLCanvasElement>();
        const view1 = ref<HTMLElement>();
        const view2 = ref<HTMLElement>();
        const view3 = ref<HTMLElement>();
        const view4 = ref<HTMLElement>();

        let tid: number;

        watch(() => props.quadView, function () {
            resize();
        });

        onMounted(function () {
            resize();
            tid = setInterval(resize, 200);
            ctx.emit('mounted', canvas.value, view1.value, view2.value, view3.value, view4.value);
        });

        onBeforeUnmount(function () {
            clearInterval(tid);
            ctx.emit('beforeUnmount');
        });

        function resize() {
            const rect = wrapper.value!.getBoundingClientRect();
            const canvasDom = canvas.value!;
            if (canvasDom.width !== rect.width || canvasDom.height !== rect.height) {
                canvasDom.width = rect.width;
                canvasDom.height = rect.height;
            }
        }

        function setView(face: string) {
            ctx.emit('setView', face);
        }

        return {
            wrapper,
            canvas,
            view1,
            view2,
            view3,
            view4,
            setView,
        };
    }
});
