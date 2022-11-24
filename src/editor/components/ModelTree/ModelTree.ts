import {defineComponent, ref} from 'vue';
import Class from '../../../common/type/Class';
import Model from '../../model/Model';
import ModelNode from '../../model/ModelNode';
import ModelNodeComponent from '../../model/ModelNodeComponent';
import ModelTreeNode from './ModelTreeNode.vue';

export default defineComponent({
    components: {ModelTreeNode},
    props: {
        model: {
            type: Model,
            required: true
        }
    },
    emits: ['setValue', 'moveNode'],
    setup(props, ctx) {
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
            dragging = true;
            const onMouseUp = function () {
                if (draggingNode.value !== dragOverNode.value
                    && draggingNode.value
                    && dragOverNode.value
                ) {
                    ctx.emit('moveNode', dragOverNode.value, dropPosition);
                }
                draggingNode.value = undefined;
                dragOverNode.value = undefined;
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mouseup', onMouseUp);
        }

        function onDragOver(node: ModelNode, position: string) {
            dragOverNode.value = node;
            dropPosition.value = position;
        }

        function onSetSelection(ids: number[]) {
            if (dragging) {
                dragging = false;
                return;
            }
            props.model.selected = ids;
        }

        return {
            onSetValue,
            onSetSelection,
            draggingNode,
            dragOverNode,
            dropPosition,
            onDragStart,
            onDragOver,
        };
    }
});
