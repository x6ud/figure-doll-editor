import {computed, defineComponent, ref} from 'vue';
import {addGlobalDragListener} from '../../utils/dom';

export default defineComponent({
    props: {
        value: {type: Number, required: true},
        min: {type: Number, required: true},
        max: {type: Number, required: true},
        step: {type: Number, required: true},
        fractionDigits: Number,
        label: String
    },
    emits: ['update:value'],
    setup(props, ctx) {
        const dom = ref<HTMLElement>();
        const valueText = computed(function () {
            return props.value.toFixed(props.fractionDigits);
        });
        const barStyle = computed(function () {
            return {
                width: `${Math.round((props.value - props.min) / (props.max - props.min) * 100)}%`
            };
        });

        function onMouseDown(e: PointerEvent) {
            addGlobalDragListener(
                e,
                function (e) {
                    const rect = dom.value!.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    let value = ratio * (props.max - props.min) + props.min;
                    value = Math.round(value / props.step) * props.step;
                    ctx.emit('update:value', value);
                },
            );
        }

        function onKeyDown(e: KeyboardEvent) {
            switch (e.key) {
                case 'ArrowLeft': {
                    ctx.emit('update:value', Math.max(props.min, props.value - props.step));
                }
                    break;
                case 'ArrowRight': {
                    ctx.emit('update:value', Math.min(props.max, props.value + props.step));
                }
                    break;
            }
        }

        return {
            dom,
            valueText,
            barStyle,
            onMouseDown,
            onKeyDown,
        };
    }
});
