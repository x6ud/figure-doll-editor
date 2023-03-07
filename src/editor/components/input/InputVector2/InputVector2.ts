import {Vector2} from 'three';
import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: {type: Vector2, required: true},
        readonly: Boolean,
        disabled: Boolean,
        resettable: Boolean,
        defaultValue: Vector2
    },
    emits: ['input'],
    setup(props, ctx) {
        const input0 = ref<HTMLInputElement>();
        const input1 = ref<HTMLInputElement>();

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
                ctx.emit('input', new Vector2(x, y));
            }
        }

        function onReset() {
            const val = new Vector2();
            if (props.defaultValue) {
                val.copy(props.defaultValue);
            }
            ctx.emit('input', val);
        }

        return {
            input0,
            input1,
            format,
            onChange,
            onPost,
            onReset,
        };
    }
});
