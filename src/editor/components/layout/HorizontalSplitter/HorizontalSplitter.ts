import {defineComponent} from 'vue';
import {addGlobalDragListener} from '../../../utils/dom';

export default defineComponent({
    props: {
        fixed: Boolean,
        size: {type: Number, required: false},
        maxSize: {type: Number, required: false},
        minSize: {type: Number, required: false},
        reverse: Boolean
    },
    emits: [
        'update:size'
    ],
    setup(props, ctx) {
        function onMouseDown(e: PointerEvent) {
            if (props.fixed) {
                return;
            }

            let size0 = props.size || 0;
            let x0 = e.clientX;

            addGlobalDragListener(
                e,
                (e) => {
                    let detX = e.clientX - x0;
                    if (!props.reverse) {
                        detX *= -1;
                    }
                    let size = size0 - detX;
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
