import {computed, defineComponent, inject, provide, ref} from 'vue';
import PopupMenuContext from './PopupMenuContext';
import PopupMenuItemContext from './PopupMenuItemContext';

export default defineComponent({
    props: {
        title: String,
        icon: String,
        hotkey: String,
        disabled: Boolean,
        sep: Boolean,
        popup: Boolean,
        checked: Boolean,
    },
    setup(props, ctx) {
        const menuItem = ref<HTMLElement>();
        const hasChild = computed<boolean>(function () {
            return !!ctx.slots.default;
        });

        const selfCtx = new PopupMenuItemContext();
        provide('popupMenuItemContext', selfCtx);
        selfCtx.parent = inject<PopupMenuContext | null>('popupMenuContext', null) || undefined;

        function onMouseOver() {
            selfCtx.parent?.handleMenuItemMouseOver(selfCtx, menuItem.value!);
        }

        function onClick(e: MouseEvent) {
            if (props.disabled || props.sep || hasChild.value) {
                return;
            }
            selfCtx.parent?.hideAll();
        }

        return {
            menuItem,
            hasChild,
            onMouseOver,
            onClick
        };
    }
});
