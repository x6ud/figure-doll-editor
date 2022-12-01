import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: String,
        readonly: Boolean,
        disabled: Boolean,
    },
    emits: ['input'],
    setup(props, ctx) {
        const inputDom = ref<HTMLInputElement>();

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
                const input = inputDom.value;
                if (input) {
                    ctx.emit('input', input.value);
                }
            }
        }

        return {inputDom, onChange, onPost};
    }
});
