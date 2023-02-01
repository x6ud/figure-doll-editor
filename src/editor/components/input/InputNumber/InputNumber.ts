import {defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: Number,
        readonly: Boolean,
        disabled: Boolean,
        min: Number,
        max: Number,
        step: Number,
        resettable: Boolean,
        defaultValue: Number,
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
                    const str = input.value;
                    let number = Number(str);
                    if (!isFinite(number)) {
                        number = 0;
                    }
                    if (props.step != null) {
                        number = Math.round(number / props.step) * props.step;
                    }
                    if (props.min != null) {
                        number = Math.max(props.min, number);
                    }
                    if (props.max != null) {
                        number = Math.min(props.max, number);
                    }
                    ctx.emit('input', number);
                }
            }
        }

        function onReset() {
            ctx.emit('input', props.defaultValue || 0);
        }

        return {inputDom, onChange, onPost, onReset};
    }
});
