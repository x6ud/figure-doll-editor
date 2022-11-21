import {computed, defineComponent} from 'vue';

export default defineComponent({
    props: {
        alpha: Number,
        beta: Number,
    },
    emits: ['setView'],
    setup(props, ctx) {
        const cubeStyle = computed(function () {
            const rx = (props.alpha || 0) / Math.PI * 180;
            const ry = -(props.beta || 0) / Math.PI * 180 - 90;
            return {transform: `rotateX(${rx}deg) rotateY(${ry}deg)`};
        });

        function setView(face: string) {
            ctx.emit('setView', face);
        }

        return {cubeStyle, setView};
    }
});
