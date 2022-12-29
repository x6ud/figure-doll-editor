import {Vector3} from 'three';
import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: {type: Vector3, required: true},
        readonly: Boolean,
        disabled: Boolean,
        resettable: Boolean,
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

        function format(val: number) {
            return Number(val.toFixed(3));
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
                ctx.emit('input', new Vector3(x, y, z));
            }
        }

        function onReset() {
            ctx.emit('input', new Vector3());
        }

        return {
            input0,
            input1,
            input2,
            format,
            onChange,
            onPost,
            onReset,
        };
    }
});
