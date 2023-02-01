import {defineComponent, inject, ref, watch} from 'vue';
import PopupDialog from '../components/popup/PopupDialog/PopupDialog.vue';
import {AlertDialogContext} from './dialogs';

export default defineComponent({
    components: {PopupDialog},
    setup() {
        const visible = ref(false);
        const content = ref('');

        const context = inject<AlertDialogContext | null>('context', null);
        if (context) {
            visible.value = context.visible;
            content.value = context.content;
        }

        watch(visible, visible => {
            if (!visible) {
                context?.onCloseCallback();
            }
        });

        function ok() {
            visible.value = false;
        }

        return {
            visible,
            content,
            ok,
        };
    }
});
