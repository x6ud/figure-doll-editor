import {Color} from 'three';
import {computed, defineComponent, PropType} from 'vue';
import ColorPicker from '../../ColorPicker/ColorPicker.vue';
import PopupMenu from '../../popup/PopupMenu/PopupMenu.vue';

export default defineComponent({
    components: {ColorPicker, PopupMenu},
    props: {
        value: Array as PropType<number[]>
    },
    emits: ['input'],
    setup(props, ctx) {
        const style = computed(function () {
            const rgb = props.value || [1, 1, 1];
            return {
                'background-color': `#${new Color().setRGB(rgb[0], rgb[1], rgb[2]).getHexString()}`
            };
        });

        function onInput(val: number[]) {
            ctx.emit('input', val);
        }

        return {
            style,
            onInput
        };
    }
});
