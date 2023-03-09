import {computed, defineComponent, PropType, ref} from 'vue';
import {addGlobalDragListener} from '../../../utils/dom';
import InputNumber from '../InputNumber/InputNumber.vue';

export default defineComponent({
    components: {InputNumber},
    props: {
        value: {
            type: Array as PropType<number[]>,
            required: true
        },
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
        maxDet: {
            type: Number,
            required: true
        },
        step: {
            type: Number,
            default: 1
        }
    },
    emits: ['input'],
    setup(props, ctx) {
        const bar = ref<HTMLElement>();
        const slider1Style = computed(function () {
            let min = props.min;
            let max = props.max;
            let value = props.value[0];
            return {'left': ((value - min) / (max - min) * 100) + '%'};
        });

        const slider2Style = computed(function () {
            let min = props.min;
            let max = props.max;
            let value = props.value[1];
            return {'left': ((value - min) / (max - min) * 100) + '%'};
        });

        const sliderBarStyle = computed(function () {
            let min = props.min;
            let max = props.max;
            return {
                'left': ((props.value[0] - min) / (max - min) * 100) + '%',
                'width': ((props.value[1] - props.value[0]) / (max - min) * 100) + '%'
            };
        });

        function inputValue1(value: number) {
            let val1 = Math.min(props.max, Math.max(props.min, Math.round(value / props.step) * props.step));
            let val2 = props.value[1];
            if (val2 < val1) {
                val2 = val1;
            }
            if (val2 - val1 > props.maxDet) {
                val2 = Math.min(props.max, Math.max(props.min, val1 + props.maxDet));
            }
            ctx.emit('input', [val1, val2]);
        }

        function inputValue2(value: number) {
            let val1 = props.value[0];
            let val2 = Math.min(props.max, Math.max(props.min, Math.round(value / props.step) * props.step));
            if (val1 > val2) {
                val1 = val2;
            }
            if (val2 - val1 > props.maxDet) {
                val1 = Math.min(props.max, Math.max(props.min, val2 - props.maxDet));
            }
            ctx.emit('input', [val1, val2]);
        }

        let focus: 'val1' | 'bar' | 'val2' = 'bar';

        function moveLeft() {
            switch (focus) {
                case 'bar':
                    let val1 = Math.min(props.max,
                        Math.max(props.min,
                            Math.round((props.value[0] - props.step) / props.step) * props.step
                        )
                    );
                    if (val1 >= props.min) {
                        let val2 = Math.min(props.max,
                            Math.max(props.min,
                                Math.round((props.value[1] + (val1 - props.value[0])) / props.step) * props.step
                            )
                        );
                        ctx.emit('input', [val1, val2]);
                    }
                    break;
                case 'val1':
                    inputValue1(props.value[0] - props.step);
                    break;
                case 'val2':
                    inputValue2(props.value[1] - props.step);
                    break;
            }
        }

        function moveRight() {
            switch (focus) {
                case 'bar':
                    let val2 = Math.min(props.max,
                        Math.max(props.min,
                            Math.round((props.value[1] + props.step) / props.step) * props.step
                        )
                    );
                    if (val2 <= props.max) {
                        let val1 = Math.min(props.max,
                            Math.max(props.min,
                                Math.round((props.value[0] + (val2 - props.value[1])) / props.step) * props.step
                            )
                        );
                        ctx.emit('input', [val1, val2]);
                    }
                    break;
                case 'val1':
                    inputValue1(props.value[0] + props.step);
                    break;
                case 'val2':
                    inputValue2(props.value[1] + props.step);
                    break;
            }
        }

        function onPointerDown(e: PointerEvent) {
            const dom = bar.value!;
            const rect = dom.getBoundingClientRect();
            const dragStartX = e.clientX - rect.left;
            const dragStartVal1 = props.value[0];
            const dragStartVal2 = props.value[1];
            const min = props.min;
            const max = props.max;
            focus = 'bar';
            if (dragStartX <= (props.value[0] - min) / (max - min) * rect.width + 2) {
                focus = 'val1';
            }
            if (dragStartX >= (props.value[1] - min) / (max - min) * rect.width - 2) {
                focus = 'val2';
            }
            addGlobalDragListener(
                e,
                e => {
                    const dom = bar.value!;
                    const rect = dom.getBoundingClientRect();
                    const dx = e.clientX - rect.left;
                    const ratio = Math.min(1, Math.max(0, dx / rect.width));
                    const value = (props.max - props.min) * ratio + props.min;

                    switch (focus) {
                        case 'bar':
                            const detValue = (dx - dragStartX) / rect.width * (props.max - props.min);
                            if (detValue < 0) {
                                let val1 = Math.min(props.max,
                                    Math.max(props.min, Math.round((dragStartVal1 + detValue) / props.step) * props.step
                                    )
                                );
                                if (val1 >= props.min) {
                                    let val2 = Math.min(props.max,
                                        Math.max(props.min,
                                            Math.round((dragStartVal2 + (val1 - dragStartVal1)) / props.step) * props.step
                                        )
                                    );
                                    ctx.emit('input', [val1, val2]);
                                }
                            } else {
                                let val2 = Math.min(props.max,
                                    Math.max(props.min, Math.round((dragStartVal2 + detValue) / props.step) * props.step
                                    )
                                );
                                if (val2 <= props.max) {
                                    let val1 = Math.min(props.max,
                                        Math.max(props.min,
                                            Math.round((dragStartVal1 + (val2 - dragStartVal2)) / props.step) * props.step
                                        )
                                    );
                                    ctx.emit('input', [val1, val2]);
                                }
                            }
                            break;
                        case 'val1':
                            if (value <= props.value[1]
                                && props.value[1] - value <= props.maxDet
                            ) {
                                inputValue1(value);
                            }
                            break;
                        case 'val2':
                            if (value >= props.value[0]
                                && value - props.value[0] <= props.maxDet
                            ) {
                                inputValue2(value);
                            }
                            break;
                    }
                }
            );
        }

        return {
            bar,
            slider1Style,
            slider2Style,
            sliderBarStyle,
            inputValue1,
            inputValue2,
            moveLeft,
            moveRight,
            onPointerDown,
        };
    }
});
