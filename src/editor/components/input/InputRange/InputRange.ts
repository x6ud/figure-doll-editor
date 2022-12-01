import {computed, defineComponent, onBeforeUnmount, ref} from 'vue';

export default defineComponent({
    props: {
        value: Number,
        min: {type: Number, required: true},
        max: {type: Number, required: true},
        step: Number,
    },
    emits: ['input'],
    setup(props, ctx) {
        const iMin = computed(function () {
            if (props.step) {
                return Math.round(props.min / props.step);
            }
            return props.min;
        });
        const iMax = computed(function () {
            if (props.step) {
                return Math.round(props.max / props.step);
            }
            return props.max;
        });
        const iValue = computed(function () {
            const value = props.value == null ? 0 : props.value;
            if (props.step) {
                return Math.round(value / props.step);
            }
            return value;
        });
        const text = computed(function () {
            const value = props.value == null ? 0 : props.value;
            if (props.step) {
                return value.toFixed(-Math.log10(props.step));
            }
            return value;
        });

        function onRangeInput(e: InputEvent) {
            let value = Number((e.target as HTMLInputElement).value);
            if (props.step) {
                value *= props.step;
            }
            ctx.emit('input', value);
        }

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

        return {
            inputDom,
            onChange,
            onPost,
            iMin,
            iMax,
            iValue,
            text,
            onRangeInput,
        };
    }
});
