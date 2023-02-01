import {defineComponent, ref} from 'vue';

export default defineComponent({
    props: {
        value: String,
        accept: String
    },
    emits: ['input'],
    setup(props, ctx) {
        const input = ref<HTMLInputElement>();

        async function onChange() {
            if (!input.value?.files) {
                return;
            }
            const file = input.value.files[0];
            if (!file) {
                return;
            }
            const dataUrl = await new Promise<string>(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function () {
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
            input.value.value = '';
            ctx.emit('input', dataUrl);
        }

        return {
            input,
            onChange,
        };
    }
});
