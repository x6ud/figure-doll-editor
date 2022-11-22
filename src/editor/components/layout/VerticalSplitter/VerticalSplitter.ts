import {defineComponent} from 'vue';
import {addGlobalDragListener} from '../../../../common/utils/dom';

export default defineComponent({
    props: {
        fixed: Boolean,
        size: {type: Number, required: false},
        maxSize: {type: Number, required: false},
        minSize: {type: Number, required: false},
        reverse: Boolean
    },
    emits: ['update:size'],
    setup(props, ctx) {
        function onMouseDown(e: MouseEvent) {
            if (props.fixed) {
                return;
            }
            let size0 = props.size || 0;
            let y0 = e.clientY;
            addGlobalDragListener(
                e,
                (e: MouseEvent) => {
                    let detY = e.clientY - y0;
                    if (props.reverse) {
                        detY *= -1;
                    }
                    let size = size0 + detY;
                    if (props.maxSize != null) {
                        size = Math.min(props.maxSize, size);
                    }
                    size = Math.max(props.minSize || 0, size);
                    ctx.emit('update:size', size);
                });
        }

        return {onMouseDown};
    }
});