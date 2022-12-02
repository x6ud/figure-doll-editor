import {Euler} from 'three';
import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: {type: Euler, required: true},
        readonly: Boolean,
        disabled: Boolean,
    },
    emits: ['input'],
    setup(props, ctx) {
        const input0 = ref<HTMLInputElement>();
        const input1 = ref<HTMLInputElement>();
        const input2 = ref<HTMLInputElement>();

        let dirty = false;

        function postOnMouseDown() {
            if (dirty) {
                onPost();
                document.removeEventListener('mousedown', postOnMouseDown);
            }
        }

        function onChange() {
            if (!dirty) {
                dirty = true;
                document.addEventListener('mousedown', postOnMouseDown);
            }
        }

        onBeforeUnmount(function () {
            document.removeEventListener('mousedown', postOnMouseDown);
        });

        function onPost() {
            if (dirty) {
                dirty = false;
                let x = Number(input0.value?.value || '0') || 0;
                let y = Number(input1.value?.value || '0') || 0;
                let z = Number(input2.value?.value || '0') || 0;
                ctx.emit('input', new Euler(x / 180 * Math.PI, y / 180 * Math.PI, z / 180 * Math.PI));
            }
        }

        function format(val: number) {
            return Number((val / Math.PI * 180).toFixed(1));
        }

        return {
            input0,
            input1,
            input2,
            onChange,
            onPost,
            format,
        };
    }
});
