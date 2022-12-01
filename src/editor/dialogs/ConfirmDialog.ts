import {defineComponent, inject, ref, watch} from 'vue';
import PopupDialog from '../components/popup/PopupDialog/PopupDialog.vue';
import {ConfirmDialogContext} from './dialogs';

export default defineComponent({
    components: {PopupDialog},
    setup() {
        const visible = ref(false);
        const content = ref('');
        let isYes = false;

        const context = inject<ConfirmDialogContext | null>('context', null);
        if (context) {
            visible.value = context.visible;
            content.value = context.content;
        }

        watch(visible, visible => {
            if (!visible) {
                context?.onCloseCallback(isYes);
            }
        });

        function yes() {
            isYes = true;
            visible.value = false;
        }

        function no() {
            visible.value = false;
        }

        return {
            visible,
            content,
            yes,
            no,
        };
    }
});