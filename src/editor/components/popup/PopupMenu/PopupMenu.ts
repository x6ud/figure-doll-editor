import {defineComponent, inject, nextTick, onMounted, onUnmounted, provide, ref} from 'vue';
import PopupMenuContext from './PopupMenuContext';
import PopupMenuItemContext from './PopupMenuItemContext';

type Style = { [name: string]: string | number };

let topMenus: PopupMenuContext[] = [];

export default defineComponent({
    props: {
        triggerBy: {
            type: String,
            default: 'mousedown'
        },
        position: {
            type: String,
            default: 'bottom'
        },
        disabled: Boolean
    },
    setup(props) {
        const trigger = ref<HTMLElement>();
        const menu = ref<HTMLElement>();
        const style = ref<Style>({left: 0, top: 0, width: 'auto', height: 'auto'});
        const scrollable = ref<boolean>(false);
        const visible = ref<boolean>(false);

        const selfCtx = new PopupMenuContext(show, hide);
        const parentCtx = inject<PopupMenuItemContext | null>('popupMenuItemContext', null);
        if (parentCtx) {
            if (parentCtx.parent) {
                selfCtx.root = parentCtx.parent.root || parentCtx.parent;
                selfCtx.zIndex = parentCtx.parent.zIndex + 1;
            }
            parentCtx.subMenu = selfCtx;
        }
        provide('popupMenuContext', selfCtx);

        onMounted(function () {
            if (!selfCtx.root) {
                topMenus.push(selfCtx);
            }
        });

        onUnmounted(function () {
            if (!selfCtx.root) {
                topMenus = topMenus.filter(curr => curr !== selfCtx);
            }
            document.body.removeEventListener('mousedown', hide);
        });

        function onTriggerMouseDown(e: MouseEvent) {
            if (props.triggerBy === 'mousedown') {
                if (visible.value) {
                    hide();
                } else {
                    show(trigger.value!, props.position);
                }
            }
        }

        function onTriggerMouseOver() {
            if (props.triggerBy === 'hover' || props.triggerBy === 'mouseover') {
                return show(trigger.value!, props.position);
            }
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                if (selfCtx.root) {
                    selfCtx.hide();
                } else {
                    hide();
                }
            }
        }

        async function show(trigger: HTMLElement, position: string) {
            if (props.disabled) {
                return;
            }

            if (!selfCtx.root) {
                topMenus.forEach(menuCtx => menuCtx.hideAll());
            }

            const windowRect = document.body.getBoundingClientRect();
            const targetRect = trigger.getBoundingClientRect();
            const maxRight = windowRect.width;
            const maxBottom = windowRect.height;

            visible.value = true;
            scrollable.value = false;
            style.value = {left: 0, top: 0, width: 'auto', height: 'auto'};
            await nextTick();

            document.body.addEventListener('mousedown', hide);
            menu.value!.focus();

            const rect = menu.value!.getBoundingClientRect();
            let x: number;
            let y: number;
            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            switch (position) {
                case 'bottom':
                    x = targetRect.left;
                    y = targetRect.bottom;
                    break;
                default:
                    x = targetRect.right;
                    y = targetRect.top;
                    break;
            }
            const newStyle: Style = {
                width: Math.floor(width) + 'px',
                height: Math.floor(height) + 'px',
                overflow: 'hidden',
                'z-index': selfCtx.zIndex
            };
            if (x + width > maxRight) {
                newStyle.right = 0;
            } else {
                newStyle.left = Math.floor(x) + 'px';
            }
            if (y + height > maxBottom) {
                const top = Math.floor(Math.max(0, maxBottom - height));
                newStyle.top = top + 'px';
                newStyle.height = Math.floor(maxBottom - top) + 'px';
            } else {
                newStyle.top = Math.floor(y) + 'px';
            }
            style.value = newStyle;
            scrollable.value = true;
        }

        function hide() {
            document.body.removeEventListener('mousedown', hide);
            visible.value = false;
            selfCtx.currentVisibleSubMenu?.subMenu?.hide();
            selfCtx.currentVisibleSubMenu = undefined;
        }

        return {
            trigger,
            menu,
            onTriggerMouseDown,
            onTriggerMouseOver,
            onKeyDown,
            style,
            scrollable,
            visible,
        };
    }
});