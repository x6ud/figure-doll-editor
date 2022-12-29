import {computed, defineComponent, ref} from 'vue';
import Class from '../../../common/type/Class';
import Model from '../../model/Model';
import ModelNode from '../../model/ModelNode';
import ModelNodeComponent from '../../model/ModelNodeComponent';
import PopupMenu from '../popup/PopupMenu/PopupMenu.vue';
import PopupMenuItem from '../popup/PopupMenu/PopupMenuItem.vue';
import ModelTreeNode from './ModelTreeNode.vue';

export default defineComponent({
    components: {PopupMenu, PopupMenuItem, ModelTreeNode},
    props: {
        model: {
            type: Model,
            required: true
        }
    },
    emits: [
        'setValue',
        'moveNode',
        'select',
        'focus',
        'cut',
        'copy',
        'paste',
        'delete',
        'convertToClay'
    ],
    setup(props, ctx) {
        const contextMenu = ref<{ show(trigger: HTMLElement, position: { x: number, y: number }): void }>();

        function onSetValue(node: ModelNode, componentClass: Class<ModelNodeComponent<any>>, value: any) {
            ctx.emit('setValue', node, componentClass, value);
        }

        let dragging = false;
        const draggingNode = ref<ModelNode>();
        const dragOverNode = ref<ModelNode>();
        const dropPosition = ref<string>('');

        function onDragStart(node: ModelNode) {
            draggingNode.value = node;
            dragOverNode.value = undefined;
            const onMouseUp = function () {
                if (draggingNode.value !== dragOverNode.value
                    && draggingNode.value
                    && dragOverNode.value
                ) {
                    ctx.emit('moveNode', dragOverNode.value, dropPosition.value);
                }
                draggingNode.value = undefined;
                dragOverNode.value = undefined;
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mouseup', onMouseUp);
        }

        function onDragOver(node: ModelNode, position: string) {
            if (node !== dragOverNode.value) {
                dragging = true;
            }
            dragOverNode.value = node;
            dropPosition.value = position;
        }

        function onSetSelection(ids: number[]) {
            if (dragging) {
                dragging = false;
                return;
            }
            ctx.emit('select', ids);
        }

        const contextMenuNode = ref<ModelNode>();
        const canConvertToClay = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            return ['Shape', 'Box', 'ObjModel', 'FbxModel'].includes(node.type);
        });

        function onContextMenu(node: ModelNode | undefined, e: PointerEvent) {
            contextMenuNode.value = node;
            contextMenu.value!.show(
                e.target as HTMLElement,
                {x: e.clientX, y: e.clientY}
            );
        }

        function onFocus() {
            ctx.emit('focus', contextMenuNode.value);
        }

        function onCut() {
            ctx.emit('cut');
        }

        function onCopy() {
            ctx.emit('copy');
        }

        function onPaste() {
            ctx.emit('paste', contextMenuNode.value);
        }

        function onDelete() {
            ctx.emit('delete');
        }

        function onConvertToClay() {
            ctx.emit('convertToClay', contextMenuNode.value);
        }

        return {
            contextMenu,
            onSetValue,
            onSetSelection,
            draggingNode,
            dragOverNode,
            dropPosition,
            onDragStart,
            onDragOver,
            onContextMenu,
            contextMenuNode,
            onFocus,
            onCut,
            onCopy,
            onPaste,
            onDelete,
            canConvertToClay,
            onConvertToClay,
        };
    }
});
