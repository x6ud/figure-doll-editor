import {defineComponent, inject, nextTick, ref, watch} from 'vue';
import PopupDialog from '../components/popup/PopupDialog/PopupDialog.vue';
import {PromptDialogContext} from './dialogs';

export default defineComponent({
    components: {PopupDialog},
    setup() {
        const visible = ref(false);
        const title = ref('');
        const input = ref<HTMLInputElement>();
        const value = ref<string | null>(null);

        let isOk = false;

        const context = inject<PromptDialogContext | null>('context', null);
        if (context) {
            visible.value = context.visible;
            title.value = context.title;
            value.value = context.value;
        }

        watch(visible,
            async visible => {
                if (visible) {
                    await nextTick();
                    input.value?.focus();
                    input.value?.select();
                } else {
                    context?.onCloseCallback(isOk ? value.value : null);
                }
            },
            {
                immediate: true
            }
        );

        function ok() {
            isOk = true;
            visible.value = false;
        }

        function cancel() {
            isOk = false;
            visible.value = false;
        }

        return {
            visible,
            title,
            input,
            value,

            ok,
            cancel,
        };
    }
});