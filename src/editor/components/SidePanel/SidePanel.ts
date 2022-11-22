import {defineComponent, PropType} from 'vue';
import {addGlobalDragListener} from '../../../common/utils/dom';

export default defineComponent({
    props: {
        width: {
            type: Number,
            default: 250
        },
        minWidth: {
            type: Number,
            default: 50
        },
        maxWidth: {
            type: Number,
            default: 500
        },
        direction: {
            type: String as PropType<'left' | 'right'>,
            default: 'left'
        },
    },
    setup(props, ctx) {
        function onResize(e: MouseEvent) {
            const size0 = props.width;
            const x0 = e.clientX;

            addGlobalDragListener(
                e,
                function (e: MouseEvent) {
                    const det = (e.clientX - x0) * (props.direction === 'left' ? -1 : 1);
                    const size = Math.min(Math.max(size0 + det, props.minWidth), props.maxWidth);
                    ctx.emit('update:width', size);
                }
            );
        }

        return {
            onResize,
        };
    }
});