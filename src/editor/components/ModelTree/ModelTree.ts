import {computed, defineComponent, ref, toRaw} from 'vue';
import CFlipDirection from '../../model/components/CFlipDirection';
import Model from '../../model/Model';
import ModelNode from '../../model/ModelNode';
import ModelNodeComponent from '../../model/ModelNodeComponent';
import {getModelNodeDef} from '../../model/ModelNodeDef';
import Class from '../../type/Class';
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
        'convertToClay',
        'applyTransformation',
        'createInstance',
        'flip',
        'copyPose',
        'pastePose',
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

        function onRangeSelect(id: number) {
            const model = toRaw(props.model);
            const selected = new Set(model.selected);
            if (!selected.size) {
                onSetSelection([id]);
                return;
            }
            const newSelection: number[] = [];
            let targetFound = false;
            let firstSelectedFound = false;
            model.forEach(node => {
                if (targetFound && firstSelectedFound) {
                    return false;
                }
                if (!firstSelectedFound && selected.has(node.id)) {
                    firstSelectedFound = true;
                }
                if (node.id === id) {
                    targetFound = true;
                }
                if (firstSelectedFound || targetFound) {
                    newSelection.push(node.id);
                }
            });
            onSetSelection(newSelection);
        }

        const contextMenuNode = ref<ModelNode>();

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

        const canConvertToClay = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            return getModelNodeDef(node.type).mesh;
        });

        function onConvertToClay() {
            ctx.emit('convertToClay', contextMenuNode.value);
        }

        const canApplyTransformation = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            return !node.instanceId && node.type === 'Clay';
        });

        function onApplyTransformation() {
            ctx.emit('applyTransformation', contextMenuNode.value);
        }

        const canCreateInstance = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            const def = getModelNodeDef(node.type);
            return !!def.instanceable && !def.unique;
        });

        const canCreateMirrorInstance = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            return !node.has(CFlipDirection);
        });

        function onCreateInstance(mirror: string) {
            ctx.emit('createInstance', contextMenuNode.value, mirror);
        }

        const canFlip = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            return ['Container', 'IKChain', 'IKNode'].includes(node.type);
        });

        function onFlip(mode: 'flip' | 'left-to-right' | 'right-to-left') {
            ctx.emit('flip', contextMenuNode.value, mode);
        }

        const hasPose = computed(function () {
            const node = contextMenuNode.value;
            if (!node) {
                return false;
            }
            return ['IKChain'].includes(node.type);
        });

        function onCopyPose() {
            ctx.emit('copyPose', contextMenuNode.value);
        }

        function onPastePose() {
            ctx.emit('pastePose', contextMenuNode.value);
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
            onRangeSelect,
            onContextMenu,
            contextMenuNode,
            onFocus,
            onCut,
            onCopy,
            onPaste,
            onDelete,
            canConvertToClay,
            onConvertToClay,
            canApplyTransformation,
            onApplyTransformation,
            canCreateInstance,
            canCreateMirrorInstance,
            onCreateInstance,
            canFlip,
            onFlip,
            hasPose,
            onCopyPose,
            onPastePose,
        };
    }
});
