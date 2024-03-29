import {computed, defineComponent, ref} from 'vue';
import CName from '../../model/components/CName';
import COpenPoseKeypoint from '../../model/components/COpenPoseKeypoint';
import CVisible from '../../model/components/CVisible';
import Model from '../../model/Model';
import ModelNode from '../../model/ModelNode';
import ModelNodeComponent from '../../model/ModelNodeComponent';
import {getModelNodeDef} from '../../model/ModelNodeDef';
import Class from '../../type/Class';

export default defineComponent({
    name: 'model-tree-node',
    props: {
        model: {
            type: Model,
            required: true
        },
        node: {
            type: ModelNode,
            required: true
        },
        depth: {
            type: Number,
            required: true
        },
        draggingNode: ModelNode,
        dragOverNode: ModelNode,
        dropPosition: String,
    },
    emits: [
        'setValue',
        'setSelection',
        'dragStart',
        'dragOver',
        'contextmenu',
        'rangeSelect',
    ],
    setup(props, ctx) {
        const dom = ref<HTMLElement>();
        const name = computed(function () {
            const node = props.node;
            if (node.type === 'OpenPoseKeypoint') {
                const type = node.value(COpenPoseKeypoint);
                return '#' + {
                    '': 'Keypoint',
                    'nose': 'Nose',
                    'neck': 'Neck',
                    'right_shoulder': 'Right Shoulder',
                    'right_elbow': 'Right Elbow',
                    'right_wrist': 'Right Wrist',
                    'left_shoulder': 'Left Shoulder',
                    'left_elbow': 'Left Elbow',
                    'left_wrist': 'Left Wrist',
                    'right_hip': 'Right Hip',
                    'right_knee': 'Right Knee',
                    'right_ankle': 'Right Ankle',
                    'left_hip': 'Left Hip',
                    'left_knee': 'Left Knee',
                    'left_ankle': 'Left Ankle',
                    'right_eye': 'Right Eye',
                    'left_eye': 'Left Eye',
                    'right_ear': 'Right Ear',
                    'left_ear': 'Left Ear',
                }[type];
            }
            return (node.has(CName) ? node.value(CName) : '') || `${getModelNodeDef(node.type).label} #${node.id}`;
        });
        const icon = computed(function () {
            return getModelNodeDef(props.node.type).icon;
        });
        const hasVisible = computed(function () {
            return props.node.has(CVisible);
        });
        const visible = computed(function () {
            return hasVisible.value && props.node.value(CVisible);
        });

        function onSetValue(node: ModelNode, componentClass: Class<ModelNodeComponent<any>>, value: any) {
            ctx.emit('setValue', node, componentClass, value);
        }

        function toggleVisible() {
            onSetValue(props.node, CVisible, !visible.value);
        }

        function toggleExpanded() {
            props.node.expanded = !props.node.expanded;
        }

        function onSetSelection(ids: number[]) {
            ctx.emit('setSelection', ids);
        }

        function onNodeClick(e: MouseEvent) {
            const id = props.node.id;
            if (e.ctrlKey) {
                const selected = props.model.selected;
                if (selected.includes(id)) {
                    ctx.emit('setSelection', selected.filter(curr => curr !== id));
                } else {
                    ctx.emit('setSelection', [...selected, id]);
                }
            } else if (e.shiftKey) {
                onRangeSelect(id);
            } else {
                ctx.emit('setSelection', [id]);
            }
        }

        function onMouseDown(e: MouseEvent) {
            if (e.shiftKey) {
                return;
            }
            if (!props.model.selected.includes(props.node.id)) {
                if (e.ctrlKey) {
                    return;
                }
                ctx.emit('setSelection', [props.node.id]);
            }
            onDragStart(props.node);
        }

        function onMouseMove(e: MouseEvent) {
            if (props.draggingNode && dom.value) {
                const rect = dom.value.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const THRESHOLD = 6;
                let position: 'before' | 'after' | 'atFirst' | 'atLast' = y <= THRESHOLD ? 'before' : (y >= rect.height - THRESHOLD ? 'after' : 'atLast');
                if (position === 'after' && props.node.children.length && props.node.expanded) {
                    position = 'atFirst';
                }
                ctx.emit('dragOver', props.node, position);
            }
        }

        function onDragStart(node: ModelNode) {
            ctx.emit('dragStart', node);
        }

        function onDragOver(node: ModelNode, position: 'before' | 'after' | 'atFirst' | 'atLast') {
            ctx.emit('dragOver', node, position);
        }

        const classnames = computed(function () {
            const node = props.node;
            const dragging = props.draggingNode === node;
            const dragOver = props.dragOverNode === node;
            const position = props.dropPosition;
            return {
                selected: props.model.selected.includes(node.id),
                dragging,
                'drag-over-before': dragOver && position === 'before',
                'drag-over-inside': dragOver && (position === 'atFirst' || position === 'atLast'),
                'drag-over-after': dragOver && position === 'after',
                instance: !!node.instanceId,
            };
        });

        function onContextMenu(node: ModelNode, e: PointerEvent) {
            ctx.emit('contextmenu', node, e);
        }

        function onRangeSelect(id: number) {
            ctx.emit('rangeSelect', id);
        }

        return {
            dom,
            name,
            icon,
            hasVisible,
            visible,
            onSetValue,
            toggleVisible,
            toggleExpanded,
            onSetSelection,
            onNodeClick,
            onMouseDown,
            onMouseMove,
            onDragStart,
            onDragOver,
            classnames,
            onContextMenu,
            onRangeSelect,
        };
    }
});
