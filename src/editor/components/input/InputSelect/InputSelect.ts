import {defineComponent, PropType, ref} from 'vue';

export default defineComponent({
    props: {
        value: String,
        disabled: Boolean,
        options: Array as PropType<string[]>
    },
    emits: ['input'],
    setup(props, ctx) {
        const selectDom = ref<HTMLSelectElement>();

        function onChange() {
            const dom = selectDom.value;
            if (dom) {
                ctx.emit('input', dom.value);
            }
        }

        return {selectDom, onChange};
    }
});
