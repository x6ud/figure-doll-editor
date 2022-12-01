import {defineComponent} from 'vue';

export default defineComponent({
    props: {
        value: Boolean
    },
    emits: ['input'],
    setup(props, ctx) {
        function flip() {
            ctx.emit('input', !props.value);
        }

        return {flip};
    }
});